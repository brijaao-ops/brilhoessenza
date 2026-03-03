import { createDriver, uploadImage } from '../services/supabase';
import { verifyIdentity } from '../services/gemini';
import { useNavigate } from 'react-router-dom';
import IdentityCamera from '../components/IdentityCamera';

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
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiResult, setAiResult] = useState<{ nameMatches: boolean; faceMatches: boolean; explanation: string } | null>(null);
    const [cameraState, setCameraState] = useState<{ isOpen: boolean; type: 'document' | 'face'; currentField: keyof typeof images | null }>({
        isOpen: false,
        type: 'document',
        currentField: null
    });
    const [base64Images, setBase64Images] = useState<{
        id_front: string | null;
        selfie: string | null;
    }>({
        id_front: null,
        selfie: null
    });
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

    const openCamera = (field: keyof typeof images, type: 'document' | 'face') => {
        setCameraState({
            isOpen: true,
            type,
            currentField: field
        });
    };

    const handleCameraCapture = (blob: Blob, base64: string) => {
        const field = cameraState.currentField;
        if (!field) return;

        const file = new File([blob], `${field}.jpg`, { type: 'image/jpeg' });

        setImages(prev => ({ ...prev, [field]: file }));
        setPreviews(prev => ({ ...prev, [field]: base64 }));

        if (field === 'id_front') {
            setBase64Images(prev => ({ ...prev, id_front: base64 }));
        } else if (field === 'selfie') {
            setBase64Images(prev => ({ ...prev, selfie: base64 }));
        }

        setCameraState({ ...cameraState, isOpen: false });
    };

    const performAIVerification = async () => {
        if (!base64Images.id_front || !base64Images.selfie) {
            showToast('Capture o BI Frente e a Selfie antes de verificar.', 'info');
            return;
        }

        setAiProcessing(true);
        setAiResult(null);

        try {
            const result = await verifyIdentity(formData.name, base64Images.id_front, base64Images.selfie);
            setAiResult(result);

            if (result.nameMatches && result.faceMatches) {
                showToast('Identidade verificada com sucesso pela IA!', 'success');
            } else {
                showToast('A IA detectou inconsistências nos documentos.', 'warning');
            }
        } catch (error) {
            showToast('Erro ao processar verificação por IA.', 'error');
        } finally {
            setAiProcessing(false);
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
                ai_verification_result: aiResult ? JSON.stringify(aiResult) : undefined,
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
        <div className="min-h-screen bg-[#fcfbf8] dark:bg-[#08112e] flex items-center justify-center p-6 py-20 relative">
            {cameraState.isOpen && (
                <IdentityCamera
                    type={cameraState.type}
                    title={cameraState.currentField === 'id_front' ? 'BI Parte Frontal' : cameraState.currentField === 'id_back' ? 'BI Parte Traseira' : 'Selfie de Comparação'}
                    onCapture={handleCameraCapture}
                    onCancel={() => setCameraState({ ...cameraState, isOpen: false })}
                />
            )}

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
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">BI Frente (Captura com Guia)</label>
                                <div
                                    onClick={() => openCamera('id_front', 'document')}
                                    className="relative aspect-[1.58/1] w-full max-w-2xl mx-auto rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.id_front ? (
                                        <img src={previews.id_front} className="w-full h-full object-cover" alt="BI Frente" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-5xl text-primary mb-3">badge</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abrir Câmera para BI Frente</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                                    </div>
                                </div>
                            </div>

                            {/* BI VERSO - LANDSCAPE */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">BI Verso (Captura com Guia)</label>
                                <div
                                    onClick={() => openCamera('id_back', 'document')}
                                    className="relative aspect-[1.58/1] w-full max-w-2xl mx-auto rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.id_back ? (
                                        <img src={previews.id_back} className="w-full h-full object-cover" alt="BI Verso" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-5xl text-primary mb-3">identity</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abrir Câmera para BI Verso</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                                    </div>
                                </div>
                            </div>

                            {/* SELFIE - PORTRAIT */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block text-center">Selfie Facial Comparativa</label>
                                <div
                                    onClick={() => openCamera('selfie', 'face')}
                                    className="relative aspect-[3/4] w-48 mx-auto rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-primary transition-colors group"
                                >
                                    {previews.selfie ? (
                                        <img src={previews.selfie} className="w-full h-full object-cover" alt="Selfie" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                            <span className="material-symbols-outlined !text-4xl text-primary mb-2">face</span>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Abrir Câmera</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white">camera_front</span>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Button & Results */}
                            <div className="pt-8">
                                <button
                                    type="button"
                                    onClick={performAIVerification}
                                    disabled={aiProcessing || !previews.id_front || !previews.selfie}
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${aiProcessing ? 'bg-gray-200 text-gray-400' : 'bg-navy dark:bg-white text-white dark:text-black shadow-2xl'
                                        }`}
                                >
                                    {aiProcessing ? (
                                        <div className="size-4 border-2 border-gray-400 border-t-transparent animate-spin rounded-full"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">psychology</span>
                                    )}
                                    {aiProcessing ? 'Processando Biometria...' : 'Verificar Autenticidade (IA)'}
                                </button>

                                {aiResult && (
                                    <div className={`mt-6 p-6 rounded-3xl space-y-4 border ${aiResult.nameMatches && aiResult.faceMatches ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Status da Verificação</span>
                                            <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${aiResult.nameMatches && aiResult.faceMatches ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {aiResult.nameMatches && aiResult.faceMatches ? 'Aprovado' : 'Revisão Necessária'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-sm ${aiResult.nameMatches ? 'text-green-500' : 'text-red-500'}`}>
                                                    {aiResult.nameMatches ? 'check_circle' : 'cancel'}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500">Nome s/ BI</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-sm ${aiResult.faceMatches ? 'text-green-500' : 'text-red-500'}`}>
                                                    {aiResult.faceMatches ? 'check_circle' : 'cancel'}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500">Facial/BI</span>
                                            </div>
                                        </div>

                                        <p className="text-[10px] font-medium text-gray-400 leading-relaxed italic">
                                            "{aiResult.explanation}"
                                        </p>
                                    </div>
                                )}
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
