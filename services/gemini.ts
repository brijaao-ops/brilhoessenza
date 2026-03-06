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
    // Try with gemini-2.0-flash first, fallback to gemini-1.5-flash
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];

    const prompt = `
    You are analyzing documents for a delivery driver registration in Angola.
    
    Image 1: Front of an Angolan National ID card (Bilhete de Identidade / BI).
    Image 2: A selfie/face photo of the person registering.

    Reference name provided by the user: "${name}"

    Your tasks:
    1. NAME CHECK: Read the full name printed on the BI card (it may be in ALL CAPS). 
       Compare it with "${name}". 
       Consider it a MATCH if the names are substantially the same, even if:
       - The user typed in mixed case vs ALL CAPS on the BI
       - Minor spelling differences or missing middle names
       - Partial name matches (first + last name match)
       Return nameMatches: true if they are the same person.

    2. FACE CHECK: Compare the small passport-style photo on the BI card with the selfie photo.
       The BI photo is small and may have lower quality - be lenient.
       Return faceMatches: true if they appear to be the same person.

    3. Write a short explanation in Portuguese (1-2 sentences).

    IMPORTANT: Return ONLY a valid JSON object, no markdown, no code blocks:
    {"nameMatches": true/false, "faceMatches": true/false, "explanation": "texto em português"}
    `;

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: idFrontBase64.includes(",")
                            ? idFrontBase64.split(",")[1]
                            : idFrontBase64,
                        mimeType: "image/jpeg",
                    },
                },
                {
                    inlineData: {
                        data: selfieBase64.includes(",")
                            ? selfieBase64.split(",")[1]
                            : selfieBase64,
                        mimeType: "image/jpeg",
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text().trim();
            console.log(`[Gemini] Raw response:`, text);

            // Extract JSON from response (handle markdown code blocks too)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                console.log(`[Gemini] Parsed result:`, parsed);
                return {
                    nameMatches: Boolean(parsed.nameMatches),
                    faceMatches: Boolean(parsed.faceMatches),
                    explanation: parsed.explanation || "Verificação concluída.",
                };
            }

            throw new Error("Resposta não contém JSON válido: " + text);
        } catch (error: any) {
            lastError = error;
            console.error(`[Gemini] Error with model ${modelName}:`, error?.message || error);
            // Try next model
        }
    }

    // All models failed
    console.error("[Gemini] All models failed. Last error:", lastError);
    return {
        nameMatches: false,
        faceMatches: false,
        explanation: `Erro na verificação automática: ${lastError?.message || "Verifique a chave da API Gemini (VITE_GEMINI_API_KEY) nas variáveis de ambiente."}`
    };
}
