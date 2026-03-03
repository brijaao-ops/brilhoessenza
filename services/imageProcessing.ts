
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
/**
 * Resizes an image (Blob) to fit within maxWidth and maxHeight using Canvas.
 */
export const resizeImage = (blob: Blob, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Não foi possível obter o contexto do canvas"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((resizedBlob) => {
                if (resizedBlob) resolve(resizedBlob);
                else reject(new Error("Falha ao criar blob redimensionado"));
            }, 'image/png', 0.85);
        };
        img.onerror = () => reject(new Error("Falha ao carregar imagem para redimensionamento"));
    });
};
