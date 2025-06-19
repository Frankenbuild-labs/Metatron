
// Fix: Removed extra '}' from the import statement.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_UI_CODER_PROMPT } from '../constants'; // Ensure constants.ts is in the parent directory or adjust path
import { ImageMimeData } from '../types';


const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not found. Gemini API functionality will be disabled.");
}

export const isApiKeyAvailable = (): boolean => !!API_KEY;


export const generateUiCodeFromImage = async (imageData: ImageMimeData): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set the API_KEY environment variable.");
  }
  if (!imageData.base64Data || !imageData.mimeType) {
    throw new Error("Image data or MIME type is missing.");
  }

  const imagePart = {
    inlineData: {
      mimeType: imageData.mimeType,
      data: imageData.base64Data,
    },
  };

  const textPart = {
    text: AI_UI_CODER_PROMPT,
  };

  try {
    // Fix: Align 'contents' structure with the multi-part content guideline.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', // Suitable for multimodal tasks
      contents: { parts: [imagePart, textPart] },
    });
    
    const text = response.text;
    if (typeof text !== 'string') {
        console.error("Unexpected API response format. Expected text.", response);
        throw new Error("Unexpected API response format. Could not extract text.");
    }
    return text;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
        // More specific error messages can be helpful
        if (error.message.includes("API key not valid")) {
            throw new Error("Invalid Gemini API Key. Please check your API_KEY environment variable.");
        }
        if (error.message.includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please check your quota or try again later.");
        }
         throw new Error(`Failed to generate UI code from image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the Gemini API.');
  }
};
