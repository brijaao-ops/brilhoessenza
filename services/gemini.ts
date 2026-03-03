import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI((import.meta as any).env.VITE_GEMINI_API_KEY);

export async function verifyIdentity(
    name: string,
    idFrontBase64: string,
    selfieBase64: string
): Promise<{
    nameMatches: boolean;
    faceMatches: boolean;
    explanation: string
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze these two images for a driver registration process:
    1. The first image is the front of a National ID card (BI).
    2. The second image is a selfie of the person registering.

    Reference Name provided by user: "${name}"

    Task:
    - Extract the full name from the ID card. Does it match "${name}"? (Allow minor typos or missing middle names).
    - Compare the face on the ID card photo with the face in the selfie. Do they belong to the same person?
    - Provide a short explanation in Portuguese.

    Return ONLY a JSON object with this exact structure:
    {
        "nameMatches": boolean,
        "faceMatches": boolean,
        "explanation": "string in Portuguese"
    }
    `;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: idFrontBase64.split(",")[1],
                    mimeType: "image/jpeg",
                },
            },
            {
                inlineData: {
                    data: selfieBase64.split(",")[1],
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Resposta inválida da IA.");
    } catch (error) {
        console.error("Gemini Verification Error:", error);
        return {
            nameMatches: false,
            faceMatches: false,
            explanation: "Erro técnico ao processar verificação biométrica."
        };
    }
}
