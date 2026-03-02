
// Dynamic import will be used inside the function to prevent crash on boot

/**
 * Removes the background from an image using AI (client-side).
 * @param imageSource The image file, blob, or URL.
 * @returns A promise that resolves to a transparent PNG Blob.
 */
export const removeImageBackground = async (
    imageSource: string | File | Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> => {
    try {
        const { default: removeBackground } = await import('@imgly/background-removal');
        const config: any = { // Using any to avoid complex type export issues with dynamic import
            progress: (percent: number) => {
                if (onProgress) onProgress(percent);
            },
            output: {
                type: 'image/png',
                quality: 1.0,
            }
        };
        const resultBlob = await removeBackground(imageSource, config);
        return resultBlob;
    } catch (error) {
        console.error("Erro na remoção de fundo por IA:", error);
        throw error;
    }
};

/**
 * Converts a Blob to a Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Process an existing image URL and return the "vectorized" (transparent) version.
 */
export const vectorizeExistingImage = async (imageUrl: string): Promise<string> => {
    try {
        const blob = await removeImageBackground(imageUrl);
        const base64 = await blobToBase64(blob);
        return base64;
    } catch (error) {
        console.error("Falha ao vetorizar imagem existente:", error);
        throw error;
    }
};
