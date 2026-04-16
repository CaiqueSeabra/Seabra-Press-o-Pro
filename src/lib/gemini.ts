import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Initialize the Gemini API client lazily to ensure environment variables are loaded
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      throw new Error("Chave da API do Gemini não encontrada. Certifique-se de que a variável GEMINI_API_KEY está configurada nos segredos (Secrets) do seu projeto no AI Studio.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function extractMeasurementFromImage(file: File) {
  try {
    const ai = getAiClient();
    // Resize image before sending to reduce payload size and avoid errors
    const base64Data = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Recommended latest flash model
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
                mimeType: 'image/jpeg'
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
    if (!text) throw new Error("No text returned from Gemini");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error extracting data from image:", error);
    const msg = error.message || "";
    
    if (msg.includes("API key not valid") || msg.includes("not found")) {
      throw new Error("Configuração Necessária: A chave do Gemini (GEMINI_API_KEY) está inválida ou ausente. Isso acontece pois no link compartilhado o app precisa da sua chave própria vinculada ao projeto. Vá em 'Settings' -> 'Secrets' no AI Studio e adicione GEMINI_API_KEY.");
    }
    
    throw new Error("Não foi possível ler os dados da foto. Tente tirar uma foto mais de perto e com boa iluminação.");
  }
}
