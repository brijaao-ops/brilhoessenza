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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            <div className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-20">
                <button onClick={onCancel} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h3 className="text-white font-black uppercase tracking-widest text-xs">{title}</h3>
                <div className="size-12"></div>
            </div>

            <div className={`relative w-full max-w-md aspect-[9/16] overflow-hidden ${type === 'face' ? 'bg-black' : ''}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Overlays */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {type === 'document' ? (
                        <div className="w-[85%] aspect-[1.58/1] border-2 border-primary border-dashed rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                            <div className="absolute -top-10 inset-x-0 text-center text-primary font-black uppercase tracking-widest text-[10px]">Alinhe o BI nesta área</div>
                        </div>
                    ) : (
                        <div className="w-[70%] aspect-square rounded-full border-2 border-primary border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                            <div className="absolute -top-10 inset-x-0 text-center text-primary font-black uppercase tracking-widest text-[10px]">Posicione seu rosto</div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
                        <span className="material-symbols-outlined !text-5xl text-red-500 mb-4">error</span>
                        <p className="text-white font-bold">{error}</p>
                        <button onClick={onCancel} className="mt-6 bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">Voltar</button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-12 flex flex-col items-center gap-8 z-20">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-center max-w-[250px]">
                    Garanta uma boa iluminação para uma verificação rápida
                </p>
                <button
                    onClick={captureImage}
                    disabled={!!error}
                    className="size-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all group disabled:opacity-50"
                >
                    <div className="size-16 border-4 border-black/10 rounded-full flex items-center justify-center">
                        <div className="size-12 bg-black rounded-full group-hover:scale-110 transition-transform"></div>
                    </div>
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default IdentityCamera;
