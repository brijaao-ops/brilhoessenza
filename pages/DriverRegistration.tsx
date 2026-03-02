import React, { useState, useRef, useEffect } from 'react';
import { createDriver, uploadImage } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';

import { useToast } from '../contexts/ToastContext';

const DriverRegistration: React.FC = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        address: '',
        transport_type: 'Mota',
        whatsapp: '',
    });

    const [images, setImages] = useState<{
        id_front: File | null;
        id_back: File | null;
        selfie: File | null;
    }>({
        id_front: null,
        id_back: null,
        selfie: null,
    });

    const [previews, setPreviews] = useState<{
        id_front: string | null;
        id_back: string | null;
        selfie: string | null;
    }>({
        id_front: null,
        id_back: null,
        selfie: null,
    });

    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [ocrResult, setOcrResult] = useState<{ success: boolean; message: string } | null>(null);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: Documents
    const navigate = useNavigate();

    // Refs for hidden file inputs
    const idFrontInputRef = useRef<HTMLInputElement>(null);
    const idBackInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'whatsapp') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 9) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof images) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
        };
        reader.readAsDataURL(file);

        setImages(prev => ({ ...prev, [type]: file }));

        if (type === 'id_front') {
            performOCR(file);
        }
    };

    const triggerInput = (type: keyof typeof images) => {
        if (type === 'id_front') idFrontInputRef.current?.click();
        else if (type === 'id_back') idBackInputRef.current?.click();
        else if (type === 'selfie') selfieInputRef.current?.click();
    };

    const performOCR = async (file: File) => {
        setOcrProcessing(true);
        setOcrResult(null);
        try {
            const worker = await createWorker('por');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const normalizedStoredName = formData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normalizedOcrText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const nameParts = normalizedStoredName.split(/\s+/).filter(p => p.length > 2);
            const matches = nameParts.length > 0 && nameParts.every(part => normalizedOcrText.includes(part));

            if (matches) {
                setOcrResult({ success: true, message: 'Identidade Validada: Nome encontrado no BI.' });
            } else {
                setOcrResult({ success: false, message: 'Aviso: Nome no BI parece não coincidir.' });
            }
        } catch (error) {
            console.error('OCR Error:', error);
            setOcrResult({ success: false, message: 'Erro na verificação automática.' });
        } finally {
            setOcrProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!images.id_front || !images.id_back || !images.selfie) {
            showToast('Por favor, capture todos os documentos e a sua selfie.', 'info');
            return;
        }

        if (formData.whatsapp.length !== 9) {
            showToast('O WhatsApp deve ter 9 dígitos.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Upload images sequentially to avoid race conditions
            let id_front_url = '';
            let id_back_url = '';
            let selfie_url = '';

            try {
                id_front_url = await uploadImage(images.id_front, 'drivers');
            } catch (err: any) {
                throw new Error('Falha ao enviar foto do BI Frente: ' + (err.message || err));
            }
            try {
                id_back_url = await uploadImage(images.id_back, 'drivers');
            } catch (err: any) {
                throw new Error('Falha ao enviar foto do BI Verso: ' + (err.message || err));
            }
            try {
                selfie_url = await uploadImage(images.selfie, 'drivers');
            } catch (err: any) {
                throw new Error('Falha ao enviar Selfie: ' + (err.message || err));
            }

            await createDriver({
                ...formData,
                id_front_url,
                id_back_url,
                selfie_url,
                active: true
            });

            setSuccess(true);
            setTimeout(() => navigate('/'), 5000);
        } catch (error: any) {
            console.error('Error registering driver:', error);
            showToast('Erro ao realizar cadastro: ' + (error.message || 'Tente novamente.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#fcfbf8] dark:bg-[#08112e] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white dark:bg-[#0d1840] rounded-[3rem] p-12 text-center shadow-2xl border border-primary/10 animate-fade-up">
                    <div className="size-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-symbols-outlined !text-4xl">verified</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Autenticação Concluída</h2>
                    <p className="text-gray-500 font-medium mb-8">O seu perfil biométrico foi enviado com sucesso.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-primary text-black font-black py-5 rounded-2xl uppercase tracking-widest text-[10px]">
                        Finalizar Processo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfbf8] dark:bg-[#08112e] flex items-center justify-center p-6 py-20">
            {/* Hidden Inputs for Native Camera */}
            <input
                type="file"
                ref={idFrontInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileChange(e, 'id_front')}
            />
            <input
                type="file"
                ref={idBackInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileChange(e, 'id_back')}
            />
            <input
                type="file"
                ref={selfieInputRef}
                className="hidden"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileChange(e, 'selfie')}
            />

            <div className="max-w-4xl w-full bg-white dark:bg-[#0d1840] rounded-[4rem] p-8 lg:p-16 shadow-2xl border border-gray-100 dark:border-white/5">

                {/* Progress Bar */}
                <div className="flex justify-center mb-12 gap-2">
                    <div className={`h-1.5 w-12 rounded-full transition-all ${step === 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                    <div className={`h-1.5 w-12 rounded-full transition-all ${step === 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                </div>

                <div className="mb-12 text-center">
                    <div className="bg-primary text-black size-12 rounded-2xl flex items-center justify-center font-black mx-auto mb-6 shadow-xl shadow-primary/20">BE</div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                        Verificação <span className="text-primary italic">Biométrica</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                        {step === 1 ? 'Dados Cadastrais do Estafeta' : 'Segurança e Autenticidade do Candidato'}
                    </p>
                </div>

                {step === 1 ? (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nome Completo</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp (+244)</label>
                                <input
                                    required
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                    placeholder="9XXXXXXXX"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email</label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="exemplo@email.com"
                                    autoComplete="off"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Senha</label>
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Morada Actual</label>
                            <input
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Ex: Bairro Talatona..."
                                className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Meio de Transporte</label>
                            <select
                                name="transport_type"
                                value={formData.transport_type}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 dark:bg-white/5 border-none px-6 py-5 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none appearance-none"
                            >
                                <option value="Mota">Mota</option>
                                <option value="Carro">Carro</option>
                                <option value="Bicicleta">Bicicleta</option>
                                <option value="A pé">A pé</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.name || formData.whatsapp.length !== 9 || !formData.email || formData.password.length < 6}
                            className="w-full py-6 bg-black text-white dark:bg-primary dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all transform hover:scale-[1.02]"
                        >
                            Continuar para Biometria
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in">
                        <div className="space-y-10">
                            {/* BI FRENTE - LANDSCAPE */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">BI Frente (Horizontal)</label>
                                <div
                                    onClick={() => triggerInput('id_front')}
                                    className="relative aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.id_front ? (
                                        <img src={previews.id_front} className="w-full h-full object-cover" alt="BI Frente" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-5xl text-primary mb-3">badge</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tirar foto da Frente do Bilhete</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                                    </div>

                                    {ocrProcessing && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 p-4 text-center">
                                            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-3"></div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Extraindo Dados...</p>
                                        </div>
                                    )}
                                </div>
                                {ocrResult && (
                                    <div className={`mt-2 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-center ${ocrResult.success ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {ocrResult.message}
                                    </div>
                                )}
                            </div>

                            {/* BI VERSO - LANDSCAPE */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">BI Verso (Horizontal)</label>
                                <div
                                    onClick={() => triggerInput('id_back')}
                                    className="relative aspect-[1.6/1] w-full max-w-2xl mx-auto rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.id_back ? (
                                        <img src={previews.id_back} className="w-full h-full object-cover" alt="BI Verso" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-5xl text-primary mb-3">identity</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tirar foto do Verso do Bilhete</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                                    </div>
                                </div>
                            </div>

                            {/* SELFIE - PORTRAIT */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block text-center">Selfie Facial</label>
                                <div
                                    onClick={() => triggerInput('selfie')}
                                    className="relative aspect-[3/4] w-48 mx-auto rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.selfie ? (
                                        <img src={previews.selfie} className="w-full h-full object-cover" alt="Selfie" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-4xl text-primary mb-2">face</span>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Rosto</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white">camera_front</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 py-6 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-6 bg-gray-100 dark:bg-white/5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-gray-200 transition-all"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !previews.id_front || !previews.id_back || !previews.selfie}
                                className={`flex-[2] py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all transform hover:scale-[1.02] shadow-xl ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-primary text-black shadow-primary/20'
                                    }`}
                            >
                                {loading ? 'Enviando Dados...' : 'Finalizar Cadastro'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DriverRegistration;
