
import React, { useState } from 'react';
import { ProductImage } from '../../types';
import { removeImageBackground, blobToBase64 } from '../../services/imageProcessing';

interface MultiImageUploadProps {
    images: ProductImage[];
    onImagesChange: (images: ProductImage[]) => void;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ images, onImagesChange }) => {
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [imageMode, setImageMode] = useState<'url' | 'upload'>('upload');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsProcessing(index);
                setProgress(0);

                // Process with AI
                const processedBlob = await removeImageBackground(file, (p) => {
                    setProgress(Math.round(p * 100));
                });

                // Convert to Base64
                const base64 = await blobToBase64(processedBlob);
                updateImage(index, base64);
            } catch (error) {
                console.error("Falha no processamento de imagem:", error);

                // Fallback: regular upload
                const reader = new FileReader();
                reader.onloadend = () => updateImage(index, reader.result as string);
                reader.readAsDataURL(file);
            } finally {
                setIsProcessing(null);
            }
        }
    };

    const updateImage = (index: number, url: string) => {
        const newImages = [...images];
        // If slot doesn't exist, fill with empty ones
        while (newImages.length <= index) {
            newImages.push({ url: '', is_main: false, order_index: newImages.length });
        }

        newImages[index] = {
            ...newImages[index],
            url,
            is_main: newImages[index].is_main || (newImages.filter(img => img.url).length === 0)
        };

        // Ensure if it's the first image ever, it becomes main
        if (newImages.filter(img => img.is_main).length === 0 && url) {
            newImages[index].is_main = true;
        }

        onImagesChange(newImages.filter(img => img.url !== '' || img.is_main));
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        const wasMain = newImages[index]?.is_main;
        newImages[index] = { ...newImages[index], url: '', is_main: false };

        // If we removed the main image, pick another one
        if (wasMain) {
            const firstAvailable = newImages.find(img => img.url !== '');
            if (firstAvailable) firstAvailable.is_main = true;
        }

        onImagesChange(newImages.filter(img => img.url !== '' || img.is_main));
    };

    const setMainImage = (index: number) => {
        const newImages = images.map((img, i) => ({
            ...img,
            is_main: i === index
        }));
        onImagesChange(newImages);
    };

    const slots = [0, 1, 2, 3];

    return (
        <div className="bg-white dark:bg-[#0d1840] p-5 md:p-8 rounded-2xl border shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-base text-primary">collections</span>
                    <h4 className="font-black uppercase tracking-widest text-[10px] text-primary">Galeria do Produto (Máx 4)</h4>
                </div>
                <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${imageMode === 'upload' ? 'bg-white dark:bg-[#1a2b5e] shadow-sm text-primary' : 'text-gray-400'}`}
                    >
                        Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${imageMode === 'url' ? 'bg-white dark:bg-[#1a2b5e] shadow-sm text-primary' : 'text-gray-400'}`}
                    >
                        URL
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {slots.map((index) => {
                    const img = images[index];
                    const hasImage = img && img.url;
                    const isMain = img && img.is_main;
                    const processing = isProcessing === index;

                    return (
                        <div key={index} className={`relative group flex flex-col gap-2`}>
                            <div className={`aspect-square rounded-xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-white/5 ${isMain ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-white/10'}`}>
                                {hasImage ? (
                                    <>
                                        <img src={img.url} className={`w-full h-full object-contain ${processing ? 'opacity-30 blur-sm' : ''}`} alt={`Preview ${index}`} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {!isMain && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMainImage(index)}
                                                    className="size-8 bg-primary text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                                    title="Definir como principal"
                                                >
                                                    <span className="material-symbols-outlined !text-lg">star</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="size-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                                title="Remover"
                                            >
                                                <span className="material-symbols-outlined !text-lg">delete</span>
                                            </button>
                                        </div>
                                        {isMain && (
                                            <div className="absolute top-2 left-2 bg-primary text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[10px]">star</span>
                                                Principal
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-300">
                                        <span className="material-symbols-outlined !text-2xl opacity-20">add_photo_alternate</span>
                                        <p className="text-[8px] font-black uppercase opacity-40">Slot {index + 1}</p>
                                    </div>
                                )}

                                {processing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-10">
                                        <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
                                        <p className="text-[8px] font-black text-primary">{progress}%</p>
                                    </div>
                                )}

                                {!hasImage && !processing && (
                                    <div className="absolute inset-0 cursor-pointer">
                                        {imageMode === 'upload' ? (
                                            <label className="w-full h-full block cursor-pointer">
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, index)} className="hidden" />
                                            </label>
                                        ) : (
                                            <button
                                                type="button"
                                                className="w-full h-full"
                                                onClick={() => {
                                                    const url = window.prompt('Insira a URL da imagem:');
                                                    if (url) updateImage(index, url);
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-[9px] text-gray-400 font-medium italic text-center">
                <span className="text-primary font-bold">Dica:</span> A imagem principal será exibida em destaque no catálogo.
            </p>
        </div>
    );
};
