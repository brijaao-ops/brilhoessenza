
import { GoogleGenAI, Type } from "@google/genai";

// Use gemini-3-pro-preview for advanced reasoning and high-quality creative text generation
const MODEL_NAME = 'gemini-3-pro-preview';

export const getFragranceAssistantResponse = async (userPrompt: string) => {
  // Initialize right before making the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction: "Você é um especialista em fragrâncias de luxo da 'Brilho Essenza'. Forneça conselhos poéticos, sofisticados e úteis sobre aromas com base nas preferências do usuário. Responda sempre em português. Mantenha as respostas elegantes e relativamente curtas.",
      },
    });
    // Use .text property directly
    return response.text || "Desculpe, não consegui processar esse pedido.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "As estrelas estão desalinhadas no momento. Por favor, tente novamente mais tarde.";
  }
};

export const generateScentProfile = async (productName: string) => {
  // Initialize right before making the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Gere um perfil olfativo (notas de Topo, Coração e Fundo) para um perfume de luxo chamado ${productName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            top: { type: Type.STRING, description: "Notas de topo voláteis e iniciais" },
            heart: { type: Type.STRING, description: "Notas de coração que definem a fragrância" },
            base: { type: Type.STRING, description: "Notas de fundo profundas e duradouras" },
          },
          required: ["top", "heart", "base"],
          propertyOrdering: ["top", "heart", "base"],
        }
      }
    });
    
    // .text property directly returns the string output. Trim to clean up potential whitespace.
    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    console.error("Erro ao gerar perfil olfativo:", error);
    return null;
  }
};
