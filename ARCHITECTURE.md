# Architecture & Flow Report (nextjs-ai-chatbot)

Last updated: 2025-12-31

This project is a **Next.js App Router** chatbot template that combines:

- **Auth**: Auth.js / NextAuth (credentials + guest login)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`) + Vercel AI Gateway provider routing
- **Streaming**: SSE UI message streams, optionally **resumable** via Redis (`resumable-stream`)
- **Persistence**: Postgres via Drizzle ORM (`drizzle-orm` + `postgres`)
- **Artifacts**: A “side panel” document system (text/code/sheet) generated/updated by tools and persisted as versions
- **Uploads**: Images to Vercel Blob used as message “file” parts

---

### What to read first (spine files)

- **App entrypoints**
  - `app/layout.tsx`: global theme + `SessionProvider`
  - `app/(chat)/layout.tsx`: sidebar + `DataStreamProvider` + loads Pyodide
  - `app/(chat)/page.tsx`: new chat creation
  - `app/(chat)/chat/[id]/page.tsx`: existing chat load + access control
- **Chat API**
  - `app/(chat)/api/chat/route.ts`: main POST streaming + tool execution + DB writes
  - `app/(chat)/api/chat/[id]/stream/route.ts`: resumable stream resume endpoint
- **AI agent wiring (AI SDK v6)**
  - `lib/ai/agents/chat-agent.ts`: `ToolLoopAgent` factory (model + instructions + tools)
- **DB**
  - `lib/db/schema.ts`, `lib/db/queries.ts`
- **Artifacts**
  - `components/artifact.tsx` (UI) + `components/data-stream-handler.tsx` (stream-to-UI bridge)
  - `lib/artifacts/server.ts` + `artifacts/*/server.ts` (generation/update handlers)

---

### Directory-level architecture

- **`app/`** (Next.js App Router)
  - **Route groups**
    - `(auth)/…`: login/register UI + auth routes
    - `(chat)/…`: chat UI + API routes (chat, history, documents, votes, uploads)
- **`components/`**
  - UI primitives (shadcn), chat UI, message rendering, artifact panel, sidebar/history
  - `DataStreamProvider` + `DataStreamHandler` for custom “data-*” stream parts
- **`lib/`**
  - `lib/ai/*`: model registry, provider routing, system prompts, tool implementations
  - `lib/db/*`: Drizzle schema + queries + migrations runner
  - `lib/errors.ts`: shared API error surface and JSON responses
  - `lib/types.ts`: **shared Chat message type** (tools + custom UI data parts)
- **`artifacts/`**
  - Artifact implementations split into **client (render/edit)** and **server (generate/update)**.
- **`hooks/`**
  - Client hooks for artifact state, chat visibility, auto-resume, etc.

---

### Runtime boundaries (Server vs Client)

This app intentionally mixes RSC (server components) and client components:

- **Server components / server-only modules**
  - Anything importing `next/headers`, `next/navigation`, `server-only`, or using `"use server"`.
  - Database access lives in `lib/db/queries.ts` and is marked `server-only`.
  - NextAuth `auth()` is used from server pages/layouts and API routes for access control.
- **Client components**
  - Chat UI (`components/chat.tsx`) uses `@ai-sdk/react` `useChat()`.
  - Artifact UI and editors are client-only.

Key pattern: RSC pages fetch initial state (session + DB messages), then client components handle interactive chat and streaming.

---

### Authentication flow (Auth.js / NextAuth)

#### Providers

Auth is configured in `app/(auth)/auth.ts` with two Credentials providers:

- **`credentials`**: email + password checked via `bcrypt-ts` against `User.password`
- **`guest`**: creates a new “guest-NNN” user in the DB and signs them in

Session enrichment:

- JWT callback stores `token.id` and `token.type` (`guest` | `regular`)
- Session callback copies those into `session.user.id` and `session.user.type`

#### Key routes

- `app/(auth)/api/auth/[...nextauth]/route.ts` re-exports NextAuth handlers (`GET`, `POST`)
- `app/(auth)/api/auth/guest/route.ts`:
  - If user is already signed in (token exists), redirect `/`
  - Otherwise `signIn("guest")` and redirect back to requested URL

#### Usage points

- `(chat)` pages call `auth()` server-side and redirect unauthenticated users to `/api/auth/guest`.
- API routes (`/api/chat`, `/api/history`, `/api/document`, etc.) all check `auth()` and enforce ownership rules.

---

### Database layer (Drizzle + Postgres)

DB schema lives in `lib/db/schema.ts`. The important tables:

- **`User`**: `{ id, email, password? }`
- **`Chat`**: `{ id, createdAt, title, userId, visibility }`
- **`Message_v2`**: `{ id, chatId, role, parts, attachments, createdAt }`
  - `parts` is JSON and stores AI SDK “UI message parts” (text, file parts, tool parts, reasoning parts, etc.)
- **`Vote_v2`**: `{ chatId, messageId, isUpvoted }`
- **`Document`**: `{ id, createdAt, title, content?, kind, userId }` with **composite PK `(id, createdAt)`**
  - This enables **document version history**: “same id, multiple createdAt rows”.
- **`Suggestion`**: suggestions attached to a document version via `(documentId, documentCreatedAt)`
- **`Stream`**: `{ id, chatId, createdAt }` used to look up the most recent stream id for resuming.

Drizzle queries live in `lib/db/queries.ts` (server-only). It uses `postgres(process.env.POSTGRES_URL!)` and wraps most failures in `ChatSDKError`.

Migrations run via:

- `pnpm db:migrate` → `lib/db/migrate.ts` (reads `.env.local`, runs migrations from `lib/db/migrations`)
- `pnpm build` also runs migrations first (`tsx lib/db/migrate && next build`)

---

### Chat UI → API → Streaming → DB (the main flow)

#### 1) Page load

- New chat: `app/(chat)/page.tsx`
  - Generates a new UUID (`generateUUID()`)
  - Chooses a model id from `chat-model` cookie or `DEFAULT_CHAT_MODEL`
  - Renders client `Chat` + `DataStreamHandler`

- Existing chat: `app/(chat)/chat/[id]/page.tsx`
  - Loads chat metadata + messages from DB (`getChatById`, `getMessagesByChatId`)
  - Enforces visibility:
    - Private chats require `session.user.id === chat.userId`
  - Converts DB rows → UI messages via `convertToUIMessages()`
  - Renders client `Chat` + `DataStreamHandler`

#### 2) User sends a message (client)

`components/chat.tsx` uses:

- `useChat<ChatMessage>()` (from `@ai-sdk/react`)
- `DefaultChatTransport({ api: "/api/chat", prepareSendMessagesRequest })`

When sending:

- It POSTs `id`, chosen `selectedChatModel`, `selectedVisibilityType`
- It sends either:
  - `{ message: lastUserMessage }` for normal messages, OR
  - `{ messages: allMessages }` for **tool approval continuation**

Attachments are uploaded first:

- `components/multimodal-input.tsx` uploads to `/api/files/upload`
- Uploaded attachment becomes a UI message part `{ type: "file", url, name, mediaType }`

#### 3) `/api/chat` validates + enforces policy (server)

In `app/(chat)/api/chat/route.ts`:

- Validates request via Zod `postRequestBodySchema` (`app/(chat)/api/chat/schema.ts`)
- Requires `auth()` and a real `session.user`
- Enforces per-user daily limit using:
  - `getMessageCountByUserId()` + `entitlementsByUserType` (`lib/ai/entitlements.ts`)
- Ensures chat ownership for existing chats
- Creates new chat on first user message:
  - Saves placeholder `"New chat"` immediately
  - Starts title generation in parallel via server action `generateTitleFromUserMessage()`

#### 4) Streaming response + tools

Still in `/api/chat`:

- **Non-reasoning models**: creates a v6 `ToolLoopAgent` (via `lib/ai/agents/chat-agent.ts`) and streams with:
  - `createAgentUIStream({ agent, uiMessages })` (AI SDK v6 helper around `agent.stream()`)
  - the agent runs the full tool loop internally (call model → execute tools → continue) for up to `stopWhen: stepCountIs(5)`
- **Reasoning models**: uses `streamText()` with tools present for message conversion but disables tool calling.

Tools wired today:

- `getWeather` (requires approval, calls Open-Meteo)
- `createDocument` (creates artifact document + streams deltas)
- `updateDocument` (updates artifact document + streams deltas)
- `requestSuggestions` (streams suggestion objects and persists them)

Streaming protocol:

- Uses `createUIMessageStream()` and merges either:
  - `createAgentUIStream(...)` (agent path), or
  - `result.toUIMessageStream({ sendReasoning: true })` (direct `streamText` path)
- Wraps to SSE using the AI SDK v6 response helper `createUIMessageStreamResponse()` when not using resumable streams.
- For resumable streams (Redis), it uses `JsonToSseTransformStream` because `resumable-stream` expects an SSE **string** stream.
- Writes custom “data-*” events (e.g. `"data-chat-title"`, `"data-textDelta"`) into the same stream.

#### 5) Persistence

During the request:

- User messages (role `"user"`) are saved immediately to `Message_v2`.
- A new `Stream` row is created (`createStreamId`) so the stream can be resumed later.

On finish:

- Normal flow: saves all finished messages to `Message_v2`
- Tool-approval flow: **updates existing messages** (tool state changed) via `updateMessage()` and inserts any new messages.

#### 6) Optional resumable streaming (Redis)

`/api/chat` attempts to create a resumable stream context:

- `createResumableStreamContext({ waitUntil: after })`
- If `REDIS_URL` is missing, resumable streams are disabled and it falls back to plain SSE.

Resume endpoint:

- `GET /api/chat/[id]/stream` returns the most recent stream for that chat if available.
- If the resumable stream is already concluded, it attempts a “SSR restore”:
  - If last DB message is an assistant message created within ~15 seconds, it emits a transient `data-appendMessage`.

Client auto-resume:

- `hooks/use-auto-resume.ts` calls `resumeStream()` when the last initial message is a user message.
- If it receives `data-appendMessage`, it appends that message into the UI.

---

### Data stream → Artifact UI bridge

There are two parallel “streams” from the server:

1) The AI SDK UI message stream (assistant tokens, tool calls, reasoning)
2) Custom “data-*” parts used to drive **Artifact** UI updates

The bridge is:

- `components/chat.tsx` `onData`: appends each `dataPart` to `DataStreamProvider`
- `components/data-stream-handler.tsx`:
  - Drains the queue
  - If `data-chat-title`, it refreshes history
  - Otherwise passes parts to the active artifact definition’s `onStreamPart`
  - Updates `useArtifact()` SWR state for:
    - `data-id`, `data-title`, `data-kind`, `data-clear`, `data-finish`

Custom stream types are defined in `lib/types.ts` (`CustomUIDataTypes`).

---

### Artifacts subsystem (documents beside chat)

Artifacts are a side panel that displays a document and supports:

- Streaming generation (from tool calls)
- Updates (from tool calls)
- Manual edits (debounced save to DB)
- Version history (because `Document` is append-only by time)
- Suggestions (for text artifacts)

#### Artifact kinds

- Implemented end-to-end (server + client): **`text`**, **`code`**, **`sheet`**
  - Server kinds are enumerated in `lib/artifacts/server.ts` as `artifactKinds = ["text", "code", "sheet"]`.
- Client-only artifact: **`image`**
  - There is an `imageArtifact` UI handler and `imageDelta` type, but there is **no server tool/handler** currently emitting `data-imageDelta`.

#### Server: creating/updating documents

- Tool `createDocument` (`lib/ai/tools/create-document.ts`)
  - Emits:
    - `data-kind`, `data-id`, `data-title`, `data-clear`
  - Delegates content creation to a “document handler” for the kind
  - Calls `saveDocument()` once final content is produced
  - Emits `data-finish`

- Tool `updateDocument` (`lib/ai/tools/update-document.ts`)
  - Loads the latest document version
  - Emits `data-clear`, streams new deltas, persists new version with `saveDocument()`, emits `data-finish`

Handlers live in:

- `artifacts/text/server.ts` → streams `"data-textDelta"` word-by-word
- `artifacts/code/server.ts` → streams `"data-codeDelta"` as a structured `code` object
- `artifacts/sheet/server.ts` → streams `"data-sheetDelta"` as structured `csv`

#### Client: viewing/editing documents

- `components/artifact.tsx`:
  - When an artifact is visible and not streaming, it fetches versions via `/api/document?id=...`
  - Manual edits POST to `/api/document?id=...` and append a new Document version locally
  - Uses artifact definition UI to render content

Artifact definitions live in `artifacts/*/client.tsx` and include:

- `onStreamPart` handlers for `data-textDelta`, `data-codeDelta`, `data-sheetDelta`, and `data-suggestion`
- UI editors (`Editor`, `CodeEditor`, `SpreadsheetEditor`, `ImageEditor`)
- Actions (copy, version navigation, run code)

Code execution detail:

- `(chat)/layout.tsx` loads Pyodide before interactive
- `artifacts/code/client.tsx` uses `globalThis.loadPyodide()` to run Python in-browser

#### Suggestions

- Tool: `requestSuggestions` (`lib/ai/tools/request-suggestions.ts`)
  - Uses `streamText({ output: Output.array(...) })` to stream structured suggestions
  - Emits `data-suggestion` for each suggestion
  - Persists suggestions to DB linked to the document version

Client text artifact:

- `artifacts/text/client.tsx` calls server action `getSuggestions()` on initialize to hydrate historical suggestions.

---

### Other API routes (supporting features)

- **History**: `GET /api/history` lists chats for the current user (cursor-based pagination)
- **Votes**: `GET/PATCH /api/vote` fetches and sets message votes (chat ownership enforced)
- **Documents**: `GET/POST/DELETE /api/document`
  - `GET`: list all versions by `id` (ownership enforced)
  - `POST`: append a new version by saving a new Document row
  - `DELETE`: delete documents/suggestions after a timestamp (used for version cleanup)
- **Uploads**: `POST /api/files/upload`
  - Auth required
  - Validates: JPEG/PNG up to 5MB
  - Uploads via `@vercel/blob` `put(..., { access: "public" })`

---

### Model selection & AI provider routing

Client:

- Model selection UI lives in `components/multimodal-input.tsx`.
- It sets a `chat-model` cookie (1 year) so server pages can choose default on load.

Server:

- `lib/ai/models.ts` defines a curated list and `DEFAULT_CHAT_MODEL`.
- `lib/ai/providers.ts` routes:
  - Normal models → `gateway.languageModel(modelId)`
  - “Reasoning”/“-thinking” models → wraps with `extractReasoningMiddleware({ tagName: "thinking" })`

Important behavior:

- Reasoning models disable tools (`experimental_activeTools: []`) and skip the “artifacts prompt”.

---

### Error handling & contracts

The project standardizes errors via `ChatSDKError` (`lib/errors.ts`):

- Error code is `${type}:${surface}` (e.g. `unauthorized:chat`)
- `toResponse()` returns JSON `{ code, message, cause }` with appropriate status
- Some surfaces (e.g. `database`) are “log-only” and return a generic message to clients

Client fetch wrappers:

- `fetchWithErrorHandlers()` converts non-2xx JSON errors to `ChatSDKError` and detects offline mode.
- `fetcher()` is used by SWR and similarly throws `ChatSDKError` on non-2xx.

---

### Dependency chain (end-to-end)

Here’s the core call graph in “who depends on who” terms:

- **`app/(chat)/*` pages/layouts**
  - depend on `auth()` (server) and `lib/db/queries.ts` (server)
  - render client `components/chat.tsx` + `components/data-stream-handler.tsx`

- **`components/chat.tsx` (client)**
  - depends on `@ai-sdk/react useChat()` and the `/api/chat` route contract
  - writes `DataUIPart`s into `DataStreamProvider`

- **`app/(chat)/api/chat/route.ts` (server)**
  - depends on:
    - `auth()`
    - `lib/ai/providers.ts`, `lib/ai/prompts.ts`, tool modules
    - `lib/db/queries.ts`
    - `resumable-stream` (optional, if Redis configured)

- **Artifacts**
  - Tools (`lib/ai/tools/*`) depend on `lib/artifacts/server.ts` handlers + DB
  - UI (`components/artifact.tsx`) depends on `/api/document` + artifact definitions

If you want a single “center of gravity” file for the entire product, it’s:

- `app/(chat)/api/chat/route.ts`

---

### Extension points (how to change the product)

- **Add a new tool**
  - Implement in `lib/ai/tools/<tool>.ts`
  - Wire into `app/(chat)/api/chat/route.ts` `tools: { ... }`
  - Add UI support if it emits custom `data-*` parts (update `lib/types.ts`)

- **Add a new artifact kind**
  - Add a server handler to `artifacts/<kind>/server.ts`
  - Add client artifact definition `artifacts/<kind>/client.tsx`
  - Register server kind in `lib/artifacts/server.ts` (`artifactKinds`, `documentHandlersByArtifactKind`)
  - Ensure `CustomUIDataTypes` includes any new `data-*` parts

- **Change rate limits**
  - Edit `lib/ai/entitlements.ts` (guest vs regular)

- **Switch default model**
  - Edit `lib/ai/models.ts` `DEFAULT_CHAT_MODEL`

---

### Notable implementation details / gotchas

- **Guest login is a “real DB user”**:
  - A new user row is created per guest session, which may grow DB usage.
- **Documents are versioned by design**:
  - `POST /api/document` creates a new row (new `createdAt`) rather than updating in place.
- **Resumable streams require Redis**:
  - If `REDIS_URL` is missing, the app still streams, but “resume” becomes a no-op (204).
- **Image artifacts are not fully wired**:
  - UI exists, but no server tool emits `data-imageDelta` currently.

---

### Guided “deep dive” walkthrough (90 minutes)

- **15m**: Entry points
  - `app/layout.tsx`, `app/(chat)/layout.tsx`, `app/(chat)/page.tsx`, `app/(chat)/chat/[id]/page.tsx`
- **25m**: Main chat loop
  - `components/chat.tsx`, `components/multimodal-input.tsx`, `app/(chat)/api/chat/route.ts`
- **20m**: Streaming and resume
  - `app/(chat)/api/chat/[id]/stream/route.ts`, `hooks/use-auto-resume.ts`
- **20m**: Artifacts
  - `components/data-stream-handler.tsx`, `components/artifact.tsx`, `lib/artifacts/server.ts`, `artifacts/*/(client|server).ts(x)`
- **10m**: DB + errors
  - `lib/db/schema.ts`, `lib/db/queries.ts`, `lib/errors.ts`


