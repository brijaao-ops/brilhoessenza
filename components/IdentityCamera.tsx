import React, { useRef, useEffect, useState } from 'react';

interface IdentityCameraProps {
    type: 'document' | 'face';
    onCapture: (blob: Blob, base64: string) => void;
    onCancel: () => void;
    title: string;
}

const IdentityCamera: React.FC<IdentityCameraProps> = ({ type, onCapture, onCancel, title }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: type === 'document' ? 'environment' : 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Não foi possível acessar a câmera. Verifique as permissões.");
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const base64 = canvas.toDataURL('image/jpeg', 0.8);
                        onCapture(blob, base64);
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-20">
                <button
                    onClick={onCancel}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-xl size-14 rounded-2xl text-white flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-white/5"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="flex flex-col items-center">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-1">{title}</h3>
                    <div className="flex gap-1">
                        <div className="h-1 w-4 rounded-full bg-primary"></div>
                        <div className="h-1 w-1 rounded-full bg-white/20"></div>
                        <div className="h-1 w-1 rounded-full bg-white/20"></div>
                    </div>
                </div>
                <div className="size-14"></div>
            </div>

            {/* Centralized Focus Area */}
            <div className="w-full max-w-xl flex flex-col items-center gap-12 animate-fade-up">
                <div className={`relative w-full overflow-hidden rounded-[3rem] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] group ${type === 'document' ? 'aspect-[1.58/1]' : 'aspect-[3/4] max-w-sm'
                    }`}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-[1.02]"
                    />

                    {/* Scanning Animation for aesthetic */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent h-1/3 animate-scan pointer-events-none opacity-30"></div>

                    {/* Guides */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center m-6">
                        {type === 'document' ? (
                            <div className="w-full h-full border-2 border-primary/50 border-dashed rounded-[2rem] relative">
                                <div className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-primary"></div>
                                <div className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-primary"></div>
                                <div className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-primary"></div>
                                <div className="absolute bottom-4 right-4 size-6 border-b-2 border-r-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="w-full aspect-[4/5] rounded-[5rem] border-2 border-primary/50 border-dashed relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full border border-white/10"></div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                            <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined !text-4xl text-red-500">error</span>
                            </div>
                            <p className="text-white font-bold mb-8">{error}</p>
                            <button onClick={onCancel} className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95">Sair</button>
                        </div>
                    )}
                </div>

                {/* Capture Controls - Right below the video */}
                <div className="flex flex-col items-center gap-8 w-full">
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={captureImage}
                            disabled={!!error}
                            className="size-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-90 transition-all group disabled:opacity-50 disabled:scale-100"
                        >
                            <div className="size-20 border-2 border-black/5 rounded-full flex items-center justify-center">
                                <div className="size-16 bg-black rounded-full group-hover:scale-105 transition-transform flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                </div>
                            </div>
                        </button>
                        <p className="text-primary font-black uppercase tracking-[0.3em] text-[8px] animate-pulse">Capturar {type === 'document' ? 'Documento' : 'Selfie'}</p>
                    </div>

                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] text-center max-w-[280px] leading-relaxed">
                        {type === 'document'
                            ? "Posicione o seu BI ou Carta de Condução dentro da moldura para captura automática de alta definição"
                            : "Mantenha o rosto centralizado e evite acessórios para garantir uma verificação facial rápida"
                        }
                    </p>
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default IdentityCamera;
