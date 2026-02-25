
import React from 'react';

interface PricingFieldsProps {
    price: number;
    salePrice: number;
    costPrice: number;
    stock: number;
    bestSeller: boolean;
    deliveryCommission: number;
    onChange: (field: string, value: any) => void;
}

const RequiredBadge = () => (
    <span className="inline-flex items-center gap-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full">
        <span className="material-symbols-outlined !text-[9px]">asterisk</span>
        Obrigatório
    </span>
);

interface FieldProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    hint?: React.ReactNode;
    accent?: 'default' | 'red' | 'green' | 'amber';
}

const Field: React.FC<FieldProps> = ({ label, required, children, hint, accent = 'default' }) => {
    const borderColors: Record<string, string> = {
        default: 'border-gray-200 dark:border-white/5',
        red: 'border-red-200 dark:border-red-900/30',
        green: 'border-green-200 dark:border-green-900/30',
        amber: 'border-amber-200 dark:border-amber-900/30',
    };
    const dotColors: Record<string, string> = {
        default: 'bg-gray-300',
        red: 'bg-red-400',
        green: 'bg-green-500',
        amber: 'bg-amber-400',
    };
    return (
        <div className={`flex flex-col gap-2 p-4 rounded-2xl border ${borderColors[accent]} bg-white/50 dark:bg-black/10`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${dotColors[accent]}`} />
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</label>
                </div>
                {required && <RequiredBadge />}
            </div>
            {children}
            {hint && <div className="text-[10px] text-gray-400">{hint}</div>}
        </div>
    );
};

export const PricingFields: React.FC<PricingFieldsProps> = ({
    price, salePrice, costPrice, stock, bestSeller, deliveryCommission, onChange
}) => {
    const margin = price > 0 && costPrice > 0 ? ((price - costPrice) / price * 100).toFixed(1) : null;
    const marginKz = price > 0 && costPrice > 0 ? price - costPrice : null;
    const isGoodMargin = margin ? Number(margin) >= 30 : null;

    return (
        <div className="bg-white dark:bg-[#15140b] p-5 md:p-8 rounded-2xl border shadow-sm flex flex-col gap-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined !text-base text-primary">payments</span>
                <h4 className="font-black uppercase tracking-widest text-[10px] text-primary">Financeiro & Estoque</h4>
            </div>

            {/* Sale Price */}
            <Field label="Preço de Venda (Kz)" required accent="default">
                <input
                    type="number"
                    min="0"
                    value={price || ''}
                    onChange={e => onChange('price', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] px-4 py-3 rounded-xl font-black text-2xl outline-none w-full focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="0"
                    required
                />
            </Field>

            {/* Cost Price — REQUIRED */}
            <Field
                label="Custo do Produto (Kz)"
                required
                accent="amber"
                hint={
                    margin !== null ? (
                        <span className={`font-black ${isGoodMargin ? 'text-green-500' : 'text-red-400'}`}>
                            Margem: {margin}% ({marginKz?.toLocaleString()} Kz por unidade)
                            {isGoodMargin ? ' ✓' : ' — abaixo do recomendado'}
                        </span>
                    ) : 'Introduz o custo de aquisição do produto'
                }
            >
                <input
                    type="number"
                    min="0"
                    value={costPrice || ''}
                    onChange={e => onChange('costPrice', Number(e.target.value))}
                    className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 rounded-xl font-black text-2xl outline-none w-full text-amber-700 dark:text-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                    placeholder="0"
                    required
                />
            </Field>

            {/* Stock — REQUIRED */}
            <Field label="Quantidade em Estoque" required accent="default">
                <input
                    type="number"
                    min="0"
                    value={stock || ''}
                    onChange={e => onChange('stock', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] px-4 py-3 rounded-xl font-bold text-2xl outline-none w-full focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="0"
                    required
                />
            </Field>

            {/* Promotional Price — optional */}
            <Field label="Preço Promocional (Opcional)" accent="red">
                <input
                    type="number"
                    min="0"
                    value={salePrice || ''}
                    onChange={e => onChange('salePrice', Number(e.target.value))}
                    className="bg-red-50 dark:bg-red-950/20 px-4 py-3 rounded-xl font-black text-2xl outline-none w-full text-red-500 focus:ring-2 focus:ring-red-400/30 transition-all"
                    placeholder="Sem promoção"
                />
            </Field>

            {/* Best Seller toggle */}
            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/5 cursor-pointer hover:bg-primary/5 transition-colors select-none">
                <input
                    id="bestSeller"
                    type="checkbox"
                    checked={bestSeller}
                    onChange={e => onChange('bestSeller', e.target.checked)}
                    className="size-5 accent-primary rounded-lg"
                />
                <div>
                    <p className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Marcar como Destaque</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Aparece com badge especial no catálogo</p>
                </div>
            </label>

            {/* Delivery Commission — REQUIRED */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-sm text-green-600">local_shipping</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">Comissão do Entregador (%)</span>
                    </div>
                    <RequiredBadge />
                </div>
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={deliveryCommission || ''}
                    onChange={e => onChange('delivery_commission', Number(e.target.value))}
                    className="bg-white dark:bg-green-950/30 px-4 py-3 rounded-xl font-black text-2xl outline-none w-full text-green-600 focus:ring-2 focus:ring-green-400/30 transition-all"
                    placeholder="0"
                    required
                />
                {deliveryCommission > 0 && price > 0 && (
                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-sm">payments</span>
                        Ganho por entrega: <span className="font-black">{((price * deliveryCommission) / 100).toLocaleString()} Kz</span>
                    </p>
                )}
            </div>
        </div>
    );
};
