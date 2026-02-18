
import React from 'react';

interface ImageUploadProps {
    image: string;
    onImageChange: (url: string) => void;
    imageMode: 'url' | 'upload';
    setImageMode: (mode: 'url' | 'upload') => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ image, onImageChange, imageMode, setImageMode }) => {
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border shadow-sm">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Visual do Item</h4>

            <div className="flex gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${imageMode === 'url' ? 'bg-primary border-primary text-black' : 'border-gray-200'}`}
                >Link HTML</button>
                <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${imageMode === 'upload' ? 'bg-primary border-primary text-black' : 'border-gray-200'}`}
                >Upload</button>
            </div>

            <div className="w-full aspect-square bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed relative overflow-hidden mb-6 flex items-center justify-center p-4">
                {image ? (
                    <img src={image} className="w-full h-full object-contain" alt="Preview" />
                ) : (
                    <span className="material-symbols-outlined !text-4xl opacity-20">image</span>
                )}
            </div>

            {imageMode === 'url' ? (
                <input
                    type="url"
                    value={image}
                    onChange={e => onImageChange(e.target.value)}
                    placeholder="Cole o link da imagem aqui..."
                    className="w-full bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                />
            ) : (
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
            )}
        </div>
    );
};
