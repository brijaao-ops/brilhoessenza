
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product, UserProfile } from '../../types';

interface AdminProductsProps {
  products: Product[];
  onDelete: (id: string) => void;
  userProfile: UserProfile | null;
}

type SortKey = 'name' | 'category' | 'price' | 'salePrice' | 'costPrice' | 'stock' | 'deliveryCommission' | 'gender' | 'rating' | 'createdAt';
type SortDir = 'asc' | 'desc';

const AdminProducts: React.FC<AdminProductsProps> = ({ products, onDelete, userProfile }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let data = [...products];
    if (filterCategory !== 'all') data = data.filter(p => p.category === filterCategory);
    if (filterGender !== 'all') data = data.filter(p => p.gender === filterGender);
    if (filterStock === 'low') data = data.filter(p => p.stock > 0 && p.stock < 5);
    else if (filterStock === 'out') data = data.filter(p => p.stock === 0);
    else if (filterStock === 'ok') data = data.filter(p => p.stock >= 5);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      let va: any = a[sortKey] ?? '';
      let vb: any = b[sortKey] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [products, filterCategory, filterGender, filterStock, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="material-symbols-outlined text-gray-300 text-xs ml-0.5">unfold_more</span>;
    return <span className="material-symbols-outlined text-primary text-xs ml-0.5">{sortDir === 'asc' ? 'expand_less' : 'expand_more'}</span>;
  };

  const totalStock = filtered.reduce((s, p) => s + p.stock, 0);
  const totalValue = filtered.reduce((s, p) => s + (p.price * p.stock), 0);
  const lowStock = filtered.filter(p => p.stock > 0 && p.stock < 5).length;
  const outOfStock = filtered.filter(p => p.stock === 0).length;
  const hasFilters = filterCategory !== 'all' || filterGender !== 'all' || filterStock !== 'all' || search;

  const canEdit = userProfile?.role === 'admin' || userProfile?.permissions?.products?.edit;
  const canCreate = userProfile?.role === 'admin' || userProfile?.permissions?.products?.create || canEdit;
  const canDelete = userProfile?.role === 'admin' || userProfile?.permissions?.products?.delete;

  return (
    <div className="p-6 lg:p-10 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Lista de <span className="text-primary italic">Produtos</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Catálogo completo do inventário</p>
        </div>
        {canCreate && (
          <Link to="/admin/produtos/novo" className="bg-primary text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-fit">
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Produto
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white dark:bg-[#15140b] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Itens</p>
          <p className="text-2xl font-black mt-0.5">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-[#15140b] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valor em Stock</p>
          <p className="text-2xl font-black mt-0.5">{totalValue.toLocaleString('pt-AO')} <span className="text-sm text-gray-400">Kz</span></p>
        </div>
        <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 shadow-sm">
          <p className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest">Stock Baixo (&lt;5)</p>
          <p className="text-2xl font-black text-orange-500 mt-0.5">{lowStock}</p>
        </div>
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 shadow-sm">
          <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Sem Stock</p>
          <p className="text-2xl font-black text-red-500 mt-0.5">{outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 md:flex-none min-w-[150px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input type="text" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-[11px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl w-full font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 w-full md:w-auto">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-[11px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
            className="px-3 py-2 text-[11px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Géneros</option>
            <option value="masculino">Masc.</option>
            <option value="feminino">Fem.</option>
            <option value="unissexo">Unis.</option>
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value as any)}
            className="px-3 py-2 text-[11px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Stock</option>
            <option value="ok">Em Stock</option>
            <option value="low">Baixo</option>
            <option value="out">Esgotado</option>
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterGender('all'); setFilterStock('all'); }}
              className="px-3 py-2 text-[10px] font-black text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all uppercase tracking-wider">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {/* Multi-Format List (Desktop Table / Mobile Cards) */}
      <div className="bg-white dark:bg-[#15140b] rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm overflow-x-auto md:overflow-visible min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
            <span className="material-symbols-outlined !text-5xl text-gray-200 dark:text-gray-700">inventory_2</span>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-4">Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden md:block">
              <table className="w-full text-left min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a190f]">
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em]">
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('name')}>
                      <span className="inline-flex items-center">Produto<SortIcon col="name" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('category')}>
                      <span className="inline-flex items-center">Categoria<SortIcon col="category" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('gender')}>
                      <span className="inline-flex items-center">Género<SortIcon col="gender" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('costPrice')}>
                      <span className="inline-flex items-center">Custo<SortIcon col="costPrice" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('price')}>
                      <span className="inline-flex items-center">Preço<SortIcon col="price" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('salePrice')}>
                      <span className="inline-flex items-center">Promoção<SortIcon col="salePrice" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('stock')}>
                      <span className="inline-flex items-center">Stock<SortIcon col="stock" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('deliveryCommission')}>
                      <span className="inline-flex items-center">Comissão<SortIcon col="deliveryCommission" /></span>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('rating')}>
                      <span className="inline-flex items-center">Rating<SortIcon col="rating" /></span>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">Curadoria</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                  {filtered.map(p => {
                    const comm = p.deliveryCommission || 0;
                    const commAmount = (p.salePrice || p.price) * comm / 100;
                    return (
                      <tr key={p.id} className="hover:bg-primary/[0.02] transition-colors text-[11px] group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10 overflow-hidden flex-shrink-0 p-0.5">
                              <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-xs truncate max-w-[180px]">{p.name}</p>
                              {p.bestSeller && (
                                <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Bestseller</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{p.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.gender === 'masculino' ? 'bg-blue-500/10 text-blue-500' : p.gender === 'feminino' ? 'bg-pink-500/10 text-pink-500' : 'bg-purple-500/10 text-purple-500'}`}>
                            {p.gender === 'masculino' ? 'M' : p.gender === 'feminino' ? 'F' : 'U'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                          {p.costPrice ? `${p.costPrice.toLocaleString('pt-AO')} Kz` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-black whitespace-nowrap">{p.price.toLocaleString('pt-AO')} Kz</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {p.salePrice ? (
                            <span className="font-black text-green-600">{p.salePrice.toLocaleString('pt-AO')} Kz</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-orange-500' : 'text-green-500'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${comm > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                              {comm}%
                            </span>
                            {comm > 0 && (
                              <span className="text-[8px] text-green-600 font-bold mt-0.5">{commAmount.toLocaleString('pt-AO')} Kz</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <span className="material-symbols-outlined text-yellow-500 text-xs">star</span>
                            <span className="text-[10px] font-bold">{p.rating}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-gray-500 truncate max-w-[100px]" title={`Registado por: ${p.createdByName || 'Desconhecido'}`}>
                              {p.createdByName?.split(' ')[0] || '—'}
                            </span>
                            {p.lastEditedBy && p.lastEditedBy !== p.createdByName && (
                              <span className="text-[10px] font-bold text-primary uppercase truncate max-w-[100px]" title={`Última edição: ${p.lastEditedBy}`}>
                                ed. {p.lastEditedBy.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <Link to={`/admin/produtos/editar/${p.id}`}
                                className="size-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                                title="Editar">
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </Link>
                            )}
                            {canDelete && (
                              <button onClick={() => { if (confirm('Eliminar este produto?')) onDelete(p.id); }}
                                className="size-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                                title="Eliminar">
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-[#1a190f] border-t-2 border-primary/20">
                  <tr className="text-[10px] font-black">
                    <td className="px-4 py-3 uppercase tracking-wider text-primary" colSpan={3}>
                      Total ({filtered.length} produtos)
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right">{totalStock} Unid.</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-50 dark:divide-white/5">
              {filtered.map((product) => (
                <div key={product.id} className="p-5 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="size-20 rounded-xl bg-gray-50 dark:bg-white/5 overflow-hidden shrink-0 border border-gray-100 dark:border-white/10 p-1">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="text-[11px] font-black uppercase truncate leading-tight">{product.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${product.stock > 10 ? 'bg-green-100 text-green-600' : product.stock > 0 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} un` : 'Esgotado'}
                        </span>
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{product.category}</p>

                      <div className="flex items-center gap-3">
                        <p className="text-xs font-black text-primary">
                          {product.salePrice ? (
                            <span className="flex items-center gap-2">
                              <span>{product.salePrice.toLocaleString()} Kz</span>
                              <span className="text-[9px] text-gray-400 line-through opacity-50">{product.price.toLocaleString()} Kz</span>
                            </span>
                          ) : (
                            <span>{product.price.toLocaleString()} Kz</span>
                          )}
                        </p>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          <span className="material-symbols-outlined !text-[10px]">star</span>
                          <span className="text-[9px] font-black text-gray-500">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50/50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Comissão Venda</p>
                      <p className="text-[10px] font-bold">{product.deliveryCommission || 0}% ({((product.salePrice || product.price) * (product.deliveryCommission || 0) / 100).toLocaleString()} Kz)</p>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Curadoria</p>
                      <p className="text-[10px] font-bold truncate">{product.createdByName || '---'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canEdit && (
                      <Link
                        to={`/admin/produtos/editar/${product.id}`}
                        className="flex-1 bg-primary text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-primary/10"
                      >
                        Editar Produto
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { if (confirm('Eliminar este produto?')) onDelete(product.id); }}
                        className="size-11 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"
                      >
                        <span className="material-symbols-outlined !text-base">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
