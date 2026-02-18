
import React from 'react';
import { Category } from '../../types';

interface CategorySelectProps {
    category: string;
    subCategory: string;
    gender: string;
    categories: Category[];
    onChange: (field: string, value: string) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ category, subCategory, gender, categories, onChange }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Categoria</label>
                <select
                    value={category}
                    onChange={e => onChange('category', e.target.value)}
                    className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none appearance-none"
                >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Gênero</label>
                <div className="flex gap-4">
                    {['masculino', 'feminino', 'unissexo'].map(g => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => onChange('gender', g)}
                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all border ${gender === g ? 'bg-[#1c1a0d] text-white border-[#1c1a0d] dark:bg-white dark:text-black' : 'border-gray-200 text-gray-400'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Subcategoria / Coleção</label>
                <input
                    type="text"
                    value={subCategory}
                    onChange={e => onChange('subCategory', e.target.value)}
                    placeholder="Ex: Gold Edition"
                    className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none"
                />
            </div>
        </div>
    );
};
