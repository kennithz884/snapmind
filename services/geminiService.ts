
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (base64Image: string) => {
  // We use gemini-3-flash-preview for fast multi-modal analysis
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Analyze this screenshot. 
          1. Summarize content in 1 sentence. 
          2. Extract visible text (OCR). 
          3. Identify category: ${Object.values(Category).join(', ')}.
          4. Extract actionable insights: Links, Phone Numbers, Addresses.
          Return as JSON.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          ocrText: { type: Type.STRING },
          category: { type: Type.STRING },
          insights: {
            type: Type.OBJECT,
            properties: {
              links: { type: Type.ARRAY, items: { type: Type.STRING } },
              phones: { type: Type.ARRAY, items: { type: Type.STRING } },
              addresses: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["summary", "ocrText", "category", "insights"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithImage = async (query: string, screenshotContext: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The following is OCR and AI summary of a screenshot: "${screenshotContext}". 
    Based on this, answer the user's question: "${query}"`,
  });
  return response.text;
};

export const semanticSearch = async (query: string, allScreenshots: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Given these screenshot summaries: ${JSON.stringify(allScreenshots.map(s => ({id: s.id, summary: s.summary, text: s.ocrText})))}. 
    Which one best matches the query: "${query}"? Return ONLY the ID of the best match or "null".`,
  });
  return response.text?.trim() || null;
};
