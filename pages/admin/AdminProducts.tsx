
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Catálogo de Produtos</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gestão completa do inventário e precificação</p>
        </div>
        {canCreate && (
          <Link to="/admin/produtos/novo" className="admin-btn-primary flex items-center gap-2 w-fit no-underline">
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Produto
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161b22] p-4 rounded-md border border-gray-200 dark:border-white/5 shadow-sm">
          <p className="admin-header-font">Total Itens</p>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-[#161b22] p-4 rounded-md border border-gray-200 dark:border-white/5 shadow-sm">
          <p className="admin-header-font">Valor em Stock</p>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{totalValue.toLocaleString('pt-AO')} <span className="text-xs font-medium text-gray-400">Kz</span></p>
        </div>
        <div className="bg-white dark:bg-[#161b22] p-4 rounded-md border border-gray-200 dark:border-white/5 shadow-sm border-l-4 border-l-orange-500">
          <p className="admin-header-font">Stock Baixo</p>
          <p className="text-xl font-bold mt-1 text-orange-600 dark:text-orange-400">{lowStock}</p>
        </div>
        <div className="bg-white dark:bg-[#161b22] p-4 rounded-md border border-gray-200 dark:border-white/5 shadow-sm border-l-4 border-l-red-500">
          <p className="admin-header-font">Sem Stock</p>
          <p className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">{outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161b22] p-3 rounded-md border border-gray-200 dark:border-white/5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input type="text" placeholder="Filtrar produtos..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded cursor-pointer focus:outline-none">
            <option value="all">Todas Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded cursor-pointer focus:outline-none">
            <option value="all">Todos Géneros</option>
            <option value="masculino">Masc.</option>
            <option value="feminino">Fem.</option>
            <option value="unissexo">Unis.</option>
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value as any)}
            className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded cursor-pointer focus:outline-none">
            <option value="all">Qualquer Stock</option>
            <option value="ok">Em Stock</option>
            <option value="low">Baixo</option>
            <option value="out">Esgotado</option>
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterGender('all'); setFilterStock('all'); }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors">
              Limpar Filtros
            </button>
          )}
        </div>
        <div className="text-[11px] text-gray-400 font-medium">
          Mostrando {filtered.length} de {products.length} produtos
        </div>
      </div>

      {/* Table Section */}
      <div className="admin-table-container">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20">
            <span className="material-symbols-outlined text-4xl text-gray-200">inventory_2</span>
            <p className="text-sm text-gray-400 mt-2">Nenhum produto corresponde aos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Produto <SortIcon col="name" /></div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">Categoria <SortIcon col="category" /></div>
                  </th>
                  <th className="text-right cursor-pointer" onClick={() => handleSort('costPrice')}>
                    <div className="flex items-center justify-end gap-1">Custo <SortIcon col="costPrice" /></div>
                  </th>
                  <th className="text-right cursor-pointer" onClick={() => handleSort('price')}>
                    <div className="flex items-center justify-end gap-1">Preço <SortIcon col="price" /></div>
                  </th>
                  <th className="text-right cursor-pointer" onClick={() => handleSort('salePrice')}>
                    <div className="flex items-center justify-end gap-1">Promo <SortIcon col="salePrice" /></div>
                  </th>
                  <th className="text-right cursor-pointer" onClick={() => handleSort('stock')}>
                    <div className="flex items-center justify-end gap-1">Stock <SortIcon col="stock" /></div>
                  </th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="size-8 object-contain rounded border border-gray-100 bg-gray-50 p-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{p.name}</p>
                          {p.bestSeller && <span className="text-[9px] px-1 bg-blue-100 text-blue-700 rounded uppercase font-bold tracking-tight">Destaque</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-500 font-medium">{p.category}</span>
                    </td>
                    <td className="text-right text-gray-500">
                      {p.costPrice ? `${p.costPrice.toLocaleString()} Kz` : '—'}
                    </td>
                    <td className="text-right font-semibold">
                      {p.price.toLocaleString()} Kz
                    </td>
                    <td className="text-right">
                      {p.salePrice ? (
                        <span className="text-green-600 font-bold">{p.salePrice.toLocaleString()} Kz</span>
                      ) : '—'}
                    </td>
                    <td className="text-right text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button onClick={() => navigate(`/admin/produtos/editar/${p.id}`)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { if (confirm('Eliminar este produto?')) onDelete(p.id); }} className="text-gray-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
