
import React, { useState } from 'react';

interface ScentQuizProps {
    onClose: () => void;
    onFilterCategory: (category: string) => void;
}

const ScentQuiz: React.FC<ScentQuizProps> = ({ onClose, onFilterCategory }) => {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const questions = [
        {
            id: 1,
            title: "Para qual ocasião?",
            options: [
                { label: "Uso Diário", val: "Fresco", icon: "sunny" },
                { label: "Evento Especial", val: "Sofisticado", icon: "diamond" },
                { label: "Noite Inesquecível", val: "Intenso", icon: "dark_mode" }
            ]
        },
        {
            id: 2,
            title: "Qual família olfativa prefere?",
            options: [
                { label: "Floral & Doce", val: "Fragrâncias", icon: "local_flower_shop" },
                { label: "Amadeirado & Forte", val: "Fragrâncias", icon: "forest" },
                { label: "Cítrico & Energético", val: "Fresco", icon: "eco" }
            ]
        },
        {
            id: 3,
            title: "Qual a intensidade desejada?",
            options: [
                { label: "Discreta (Sutil)", val: "low", icon: "feather" },
                { label: "Moderada (Presente)", val: "mid", icon: "waves" },
                { label: "Marcante (Impacto)", val: "high", icon: "bolt" }
            ]
        }
    ];

    const handleNext = (val: string) => {
        setAnswers(prev => ({ ...prev, [step]: val }));
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Recommendation Logic
            onFilterCategory('Fragrâncias');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white dark:bg-[#15140b] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-up">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5">
                    <div
                        className="h-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                <div className="p-8 lg:p-16 text-center">
                    <button onClick={onClose} className="absolute top-8 right-8 size-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 hover:bg-primary transition-colors group">
                        <span className="material-symbols-outlined !text-sm group-hover:text-black">close</span>
                    </button>

                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Assistente de Luxo</span>
                    <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-12">
                        {questions[step - 1].title}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {questions[step - 1].options.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => handleNext(opt.val)}
                                className="group flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-primary hover:bg-primary/5 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-white dark:bg-[#1c1a0d] rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-black transition-colors">
                                        <span className="material-symbols-outlined">{opt.icon}</span>
                                    </div>
                                    <span className="font-bold text-sm lg:text-base">{opt.label}</span>
                                </div>
                                <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all font-light">arrow_right_alt</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-12 flex justify-center gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-gray-200 dark:bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScentQuiz;
