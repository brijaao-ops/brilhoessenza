import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Slide } from '../../types';
import { fetchSlides, deleteSlide } from '../../services/supabase';

const AdminSlides: React.FC = () => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSlides = async () => {
        setLoading(true);
        const data = await fetchSlides();
        setSlides(data);
        setLoading(false);
    };

    useEffect(() => {
        loadSlides();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este slide?')) {
            await deleteSlide(id);
            loadSlides();
        }
    };

    return (
        <div className="p-8 lg:p-12">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Slides</span></h2>
                    <p className="text-sm text-gray-500 font-medium italic">Configure os banners principais da página inicial.</p>
                </div>
                <Link
                    to="/admin/slides/novo"
                    className="bg-primary text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px]"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Slide
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <p className="text-gray-400 font-bold uppercase animate-pulse">Sincronizando Galeria...</p>
                ) : slides.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem]">
                        <span className="material-symbols-outlined !text-6xl text-gray-200 mb-4">collections</span>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Nenhum slide configurado</p>
                    </div>
                ) : (
                    slides.map((slide) => (
                        <div key={slide.id} className="bg-white dark:bg-[#15140b] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-[#222115] group hover:shadow-2xl transition-all">
                            <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-black">
                                <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                                    <Link to={`/admin/slides/editar/${slide.id}`} className="size-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                                        <span className="material-symbols-outlined">edit</span>
                                    </Link>
                                    <button onClick={() => handleDelete(slide.id)} className="size-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
                                    Ordem: {slide.order_index}
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">{slide.subtitle}</p>
                                <h4 className="font-black text-xl mb-4 leading-tight">{slide.title}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-sm text-gray-400">link</span>
                                    <span className="text-[10px] font-bold text-gray-400 truncate">{slide.button_link}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminSlides;
