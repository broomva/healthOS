import { experimental_generateImage as generateImage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createDocumentHandler } from "@/lib/artifacts/server";

const openai = createOpenAI({});

export const imageDocumentHandler = createDocumentHandler<"image">({
  kind: "image",
  onCreateDocument: async ({ title, dataStream }) => {
    const { image } = await generateImage({
      model: openai.image("gpt-image-1"),
      prompt: title,
      size: "1024x1024",
    });

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return image.base64;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const { image } = await generateImage({
      model: openai.image("gpt-image-1"),
      prompt: description,
      size: "1024x1024",
    });

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return image.base64;
  },
});
