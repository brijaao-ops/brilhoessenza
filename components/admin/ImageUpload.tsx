
import React, { useState } from 'react';
import { removeImageBackground, blobToBase64 } from '../../services/imageProcessing';

interface ImageUploadProps {
    image: string;
    onImageChange: (url: string) => void;
    imageMode: 'url' | 'upload';
    setImageMode: (mode: 'url' | 'upload') => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ image, onImageChange, imageMode, setImageMode }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsProcessing(true);
                setProgress(0);

                // Process with AI
                const processedBlob = await removeImageBackground(file, (p) => {
                    setProgress(Math.round(p * 100));
                });

                // Convert to Base64 for the application
                const base64 = await blobToBase64(processedBlob);
                onImageChange(base64);
            } catch (error) {
                console.error("Falha no processamento de imagem:", error);

                // Fallback: regular upload if AI fails
                const reader = new FileReader();
                reader.onloadend = () => onImageChange(reader.result as string);
                reader.readAsDataURL(file);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-[#0d1840] p-5 md:p-8 rounded-2xl border shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-base text-primary">image</span>
                <h4 className="font-black uppercase tracking-widest text-[10px] text-primary">Imagem do Produto</h4>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl border transition-all ${imageMode === 'url' ? 'bg-primary border-primary text-black' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                >
                    <span className="material-symbols-outlined !text-sm align-middle mr-1">link</span>Link URL
                </button>
                <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl border transition-all ${imageMode === 'upload' ? 'bg-primary border-primary text-black' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                >
                    <span className="material-symbols-outlined !text-sm align-middle mr-1">upload</span>Galeria
                </button>
            </div>

            {/* Preview — shorter on mobile, square on desktop */}
            <div className="w-full aspect-video md:aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden flex items-center justify-center">
                {image ? (
                    <>
                        <img src={image} className={`w-full h-full object-contain ${isProcessing ? 'opacity-30 blur-sm' : ''}`} alt="Preview" />
                        <button
                            type="button"
                            onClick={() => onImageChange('')}
                            className="absolute top-2 right-2 size-7 bg-black/50 text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                            <span className="material-symbols-outlined !text-base">close</span>
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <span className="material-symbols-outlined !text-4xl text-gray-200">image</span>
                        <p className="text-[10px] font-bold uppercase">Sem imagem</p>
                    </div>
                )}

                {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-50">
                        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Vetorizando via IA...</p>
                        <p className="text-[12px] font-black mt-2 text-primary">{progress}%</p>
                    </div>
                )}
            </div>

            {/* Input */}
            {imageMode === 'url' ? (
                <input
                    type="url"
                    value={image}
                    onChange={e => onImageChange(e.target.value)}
                    placeholder="Cole o link da imagem (https://...)"
                    className="w-full bg-gray-50 dark:bg-[#08112e] p-3.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none border border-transparent"
                />
            ) : (
                <label className="flex flex-col items-center gap-2 bg-gray-50 dark:bg-[#08112e] rounded-xl p-4 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary/40 transition-colors">
                    <span className="material-symbols-outlined !text-2xl text-gray-400">upload_file</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Toca para escolher imagem</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
            )}
        </div>
    );
};
