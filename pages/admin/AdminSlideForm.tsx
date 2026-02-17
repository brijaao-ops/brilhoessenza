import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Slide } from '../../types';
import { fetchSlides, addSlide, updateSlide, uploadImage } from '../../services/supabase';

const AdminSlideForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [formData, setFormData] = useState<Omit<Slide, 'id'>>({
        title: '',
        subtitle: '',
        image_url: '',
        button_text: 'Descobrir Catálogo',
        button_link: '#produtos',
        order_index: 0
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            const loadSlide = async () => {
                const allSlides = await fetchSlides();
                const slide = allSlides.find(s => s.id === id);
                if (slide) {
                    setFormData({
                        title: slide.title,
                        subtitle: slide.subtitle,
                        image_url: slide.image_url,
                        button_text: slide.button_text,
                        button_link: slide.button_link,
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
            let finalImageUrl = formData.image_url;

            if (selectedFile) {
                finalImageUrl = await uploadImage(selectedFile);
            }

            if (!finalImageUrl) {
                alert("Por favor, selecione uma imagem ou forneça uma URL.");
                setUploading(false);
                return;
            }

            const slideData = { ...formData, image_url: finalImageUrl };

            if (isEditing) {
                await updateSlide(id!, slideData);
            } else {
                await addSlide(slideData);
            }
            navigate('/admin/slides');
        } catch (error: any) {
            alert(`Erro ao salvar slide: ${error.message || 'Erro desconhecido'}. Verifique se as configurações do Supabase (tabela e bucket) estão corretas.`);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-8 lg:p-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-6 mb-12">
                <Link to="/admin/slides" className="size-14 bg-white dark:bg-[#15140b] rounded-2xl flex items-center justify-center hover:bg-primary border border-gray-100 dark:border-white/5 transition-all shadow-sm">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">
                        {isEditing ? 'Refinar' : 'Novo'} <span className="text-primary italic">Banner</span>
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 px-1">Curadoria Visual da Home</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-12">
                    <div className="bg-white dark:bg-[#15140b] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-10">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-6 md:col-span-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imagem de Fundo (Upload Local)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-3 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/5 hover:border-primary transition-all cursor-pointer group">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">upload_file</span>
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-primary transition-colors">
                                                {selectedFile ? selectedFile.name : 'Clique para selecionar do dispositivo'}
                                            </span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        <div className="text-gray-300 font-black italic">OU</div>
                                        <input
                                            type="url"
                                            value={formData.image_url.startsWith('data:') ? '' : formData.image_url}
                                            onChange={e => {
                                                setFormData({ ...formData, image_url: e.target.value });
                                                setSelectedFile(null);
                                            }}
                                            className="flex-1 bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-bold outline-none border border-transparent focus:border-primary transition-all text-xs"
                                            placeholder="URL da Imagem Externa"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="aspect-video w-full bg-black/5 rounded-3xl overflow-hidden border-2 border-dashed border-gray-100 dark:border-white/5 mb-4 flex items-center justify-center md:col-span-2">
                                {formData.image_url ? (
                                    <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="material-symbols-outlined !text-4xl opacity-10">image</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tag Superior (Subtitle)</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-bold outline-none text-xs"
                                    placeholder="Ex: Edição Limitada"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordem de Exibição</label>
                                <input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: Number(e.target.value) })}
                                    className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-bold outline-none text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título de Impacto (Suporta <span className="text-primary italic">HTML/Cores</span>)</label>
                                <textarea
                                    rows={2}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-black text-2xl outline-none resize-none leading-tight"
                                    placeholder="Ex: Sua Essenza Inesquecível"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texto do Botão</label>
                                <input
                                    type="text"
                                    value={formData.button_text}
                                    onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                                    className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-bold outline-none text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                    Link de Destino
                                    <span className="text-[9px] text-primary lowercase italic Normal">Dica: use #produtos para rolar até o catálogo</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.button_link}
                                    onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                                    className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl font-bold outline-none text-xs"
                                    placeholder="#produtos ou /url"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className={`bg-black dark:bg-white text-white dark:text-black font-black px-16 py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {uploading && <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
                                {uploading ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Publicar no Site')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminSlideForm;
