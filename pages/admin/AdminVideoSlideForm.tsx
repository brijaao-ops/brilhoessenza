import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { VideoSlide } from '../../types';
import { fetchVideoSlides, addVideoSlide, updateVideoSlide, uploadImage } from '../../services/supabase';

const AdminVideoSlideForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [formData, setFormData] = useState<Omit<VideoSlide, 'id'>>({
        title: '',
        video_url: '',
        active: true,
        order_index: 0
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            const loadSlide = async () => {
                const allSlides = await fetchVideoSlides();
                const slide = allSlides.find(s => s.id === id);
                if (slide) {
                    setFormData({
                        title: slide.title || '',
                        video_url: slide.video_url,
                        active: slide.active,
                        order_index: slide.order_index
                    });
                }
            };
            loadSlide();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalVideoUrl = formData.video_url;

            if (selectedFile) {
                // Using the existing uploadImage for video as well, 
                // but usually videos need a 'videos' bucket. 
                // Let's check if we should use a different bucket.
                finalVideoUrl = await uploadImage(selectedFile, 'videos');
            }

            if (!finalVideoUrl) {
                alert("Por favor, selecione um vídeo ou forneça uma URL.");
                setUploading(false);
                return;
            }

            const slideData = { ...formData, video_url: finalVideoUrl };

            if (isEditing) {
                await updateVideoSlide(id!, slideData);
            } else {
                await addVideoSlide(slideData);
            }
            navigate('/admin/video-slides');
        } catch (error: any) {
            alert(`Erro ao salvar vídeo slide: ${error.message || 'Erro desconhecido'}`);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Create preview URL
            const url = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, video_url: url }));
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-12">
                <Link to="/admin/video-slides" className="size-12 lg:size-14 bg-white dark:bg-[#0d1840] rounded-2xl flex items-center justify-center hover:bg-primary border border-gray-100 dark:border-white/5 transition-all shadow-sm">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-tighter">
                        {isEditing ? 'Refinar' : 'Novo'} <span className="text-primary italic">Vídeo Slide</span>
                    </h2>
                    <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 lg:mt-2 px-1">Curadoria de Vídeo (Proporção 4:5)</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-12">
                    <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-8 lg:space-y-10">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            <div className="flex flex-col gap-4 lg:gap-6 md:col-span-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vídeo (Upload Local)</label>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <label className="w-full sm:flex-1 flex items-center justify-center gap-3 bg-gray-50 dark:bg-black/20 p-4 lg:p-5 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/5 hover:border-primary transition-all cursor-pointer group">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">movie</span>
                                            <span className="text-[11px] font-bold text-gray-400 group-hover:text-primary transition-colors truncate">
                                                {selectedFile ? selectedFile.name : 'Selecione vídeo'}
                                            </span>
                                            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                                        </label>
                                        <div className="text-gray-300 font-black italic text-xs">OU</div>
                                        <input
                                            type="url"
                                            value={formData.video_url.startsWith('blob:') ? '' : formData.video_url}
                                            onChange={e => {
                                                setFormData({ ...formData, video_url: e.target.value });
                                                setSelectedFile(null);
                                            }}
                                            className="w-full sm:flex-1 bg-gray-50 dark:bg-black/20 p-4 lg:p-5 rounded-2xl font-bold outline-none border border-transparent focus:border-primary transition-all text-xs"
                                            placeholder="URL do Vídeo Externo"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="aspect-[4/5] max-w-[300px] bg-black/5 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-dashed border-gray-100 dark:border-white/5 mb-2 flex items-center justify-center md:col-span-2 mx-auto">
                                {formData.video_url ? (
                                    <video src={formData.video_url} className="w-full h-full object-cover" controls />
                                ) : (
                                    <span className="material-symbols-outlined !text-4xl opacity-10">movie</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título do Vídeo (Opcional)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-gray-50 dark:bg-black/20 p-4 lg:p-5 rounded-2xl font-bold outline-none text-xs"
                                    placeholder="Ex: Coleção Verão 2024"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordem de Exibição</label>
                                <input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: Number(e.target.value) })}
                                    className="bg-gray-50 dark:bg-black/20 p-4 lg:p-5 rounded-2xl font-bold outline-none text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        className="size-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo (Exibir no site)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className={`w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black font-black px-12 lg:px-16 py-4 lg:py-5 rounded-xl lg:rounded-2xl uppercase tracking-widest text-[10px] lg:text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {uploading && <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
                                {uploading ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Publicar Vídeo')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminVideoSlideForm;
