import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// The API key is injected via Vite's define plugin from process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractMeasurementFromImage(file: File) {
  try {
    // Convert File to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Extract the blood pressure measurement from this image of a blood pressure monitor. Return a JSON object with three number fields: "systolic", "diastolic", and "pulse". If you cannot find a value, return null for that field. Return ONLY the raw JSON object, without any markdown formatting or code blocks.'
            },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            systolic: { type: "NUMBER" },
            diastolic: { type: "NUMBER" },
            pulse: { type: "NUMBER" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting data from image:", error);
    throw error;
  }
}
