import { experimental_generateImage as generateImage } from "ai";
import { put } from "@vercel/blob";
import { getImageModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

async function persistImage(id: string, base64: string): Promise<string> {
  try {
    const blob = await put(
      `images/${id}-${Date.now()}.png`,
      Buffer.from(base64, "base64"),
      { access: "public", contentType: "image/png" }
    );
    return blob.url;
  } catch {
    // Blob not configured — fall back to storing base64
    return base64;
  }
}

export const imageDocumentHandler = createDocumentHandler<"image">({
  kind: "image",
  onCreateDocument: async ({ id, title, dataStream }) => {
    const { image } = await generateImage({
      model: getImageModel(),
      prompt: title,
      size: "1024x1024",
    });

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return await persistImage(id, image.base64);
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const { image } = await generateImage({
      model: getImageModel(),
      prompt: description,
      size: "1024x1024",
    });

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return await persistImage(document.id, image.base64);
  },
});
