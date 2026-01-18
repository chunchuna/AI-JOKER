import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Safety check for API Key
const getClient = () => {
    const key = process.env.API_KEY;
    if (!key) {
        console.warn("API_KEY not found. Image generation will fail.");
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

export interface GenerateImageParams {
    prompt: string;
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
}

export const generateJokerImage = async (params: GenerateImageParams): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    {
                        text: params.prompt + ", tarot card style, vibrant colors, vector illustration, magical aura",
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: params.aspectRatio,
                    imageSize: params.imageSize
                },
            },
        });

        // Parse response for image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64 = part.inlineData.data;
                return `data:image/png;base64,${base64}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Image Generation Failed:", error);
        return null;
    }
};
