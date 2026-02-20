
import React from 'react';

interface PricingFieldsProps {
    price: number;
    salePrice: number;
    stock: number;
    bestSeller: boolean;
    deliveryCommission: number;
    onChange: (field: string, value: any) => void;
}

export const PricingFields: React.FC<PricingFieldsProps> = ({ price, salePrice, stock, bestSeller, deliveryCommission, onChange }) => {
    return (
        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border shadow-sm flex flex-col gap-6">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-2 text-primary">Financeiro & Estoque</h4>

            <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase text-gray-400">Preço Venda (Kz)</label>
                <input
                    type="number"
                    value={price}
                    onChange={e => onChange('price', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-black text-xl outline-none"
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase text-gray-400">Preço Promocional (Opcional)</label>
                <input
                    type="number"
                    value={salePrice}
                    onChange={e => onChange('salePrice', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-black text-xl outline-none text-red-500"
                    placeholder="0"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Estoque Disponível</label>
                <input
                    type="number"
                    value={stock}
                    onChange={e => onChange('stock', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-bold outline-none"
                />
            </div>

            <div className="flex items-center gap-4 mt-2">
                <input
                    id="bestSeller"
                    type="checkbox"
                    checked={bestSeller}
                    onChange={e => onChange('bestSeller', e.target.checked)}
                    className="size-6 text-primary focus:ring-primary border-gray-300 rounded-lg"
                />
                <label htmlFor="bestSeller" className="text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer">Marcar como Destaque</label>
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100 dark:border-[#222115]">
                <h4 className="font-black uppercase tracking-widest text-[10px] text-green-600 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm">local_shipping</span>
                    Comissão de Entrega
                </h4>
                <label className="text-[9px] font-black uppercase text-gray-400">Percentagem do Entregador (%)</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={deliveryCommission}
                    onChange={e => onChange('delivery_commission', Number(e.target.value))}
                    className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-black text-xl outline-none text-green-600"
                    placeholder="0"
                />
                {deliveryCommission > 0 && price > 0 && (
                    <p className="text-[10px] text-gray-400">
                        Ganho por unidade: <span className="font-black text-green-600">
                            {((price * deliveryCommission) / 100).toLocaleString()} Kz
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};
