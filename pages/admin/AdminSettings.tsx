import React, { useState, useEffect } from 'react';
import { supabase, UserProfile, fetchProfile, updateAppSetting, updateUserPassword, fetchStorageMetrics } from '../../services/supabase';
import { StorageMetrics } from '../../types';
import { removeImageBackground, blobToBase64, resizeImage } from '../../services/imageProcessing';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  // Bulk Vectorization State
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCurrent, setBulkCurrent] = useState(0);
  const [bulkErrors, setBulkErrors] = useState(0);
  
  // Storage Metrics State
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Estados Carregados do LocalStorage
  const [companyName, setCompanyName] = useState('Brilho Essenza Internacional');
  const [companyPhone, setCompanyPhone] = useState('244923000000');
  const [companyAddress, setCompanyAddress] = useState('Avenida Talatona, Edifício Cristal, Luanda');
  const [heritage, setHeritage] = useState('Redefinindo o luxo em Angola através da excelência olfativa e cosmética desde 1994.');

  // Políticas de Apoio
  const [shippingPolicy, setShippingPolicy] = useState('Entregas em Luanda em até 24h. Províncias entre 3 a 5 dias úteis via DHL.');
  const [returnPolicy, setReturnPolicy] = useState('Artigos de perfumaria selados podem ser devolvidos em até 7 dias após a recepção.');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#f2d00d');

  // Configurações Fiscais & Pagamento (Angola)
  const [taxRate, setTaxRate] = useState('14');
  const [enableMCX, setEnableMCX] = useState(false);
  const [mcxPhone, setMcxPhone] = useState('');
  const [enableIBAN, setEnableIBAN] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankIBAN, setBankIBAN] = useState('');

  // Configurações de Logística
  const [shippingLuanda, setShippingLuanda] = useState('2500');
  const [shippingProvinces, setShippingProvinces] = useState('5000');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('100000');

  // Estados de Segurança
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [userName, setUserName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(p => {
          setCurrentUser(p);
          if (p?.full_name) setUserName(p.full_name);
        });
      } else {
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          setCurrentUser(p);
          if (p?.full_name) setUserName(p.full_name);
        }
      }
    });

    const saved = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
    if (saved.companyName) setCompanyName(saved.companyName);
    if (saved.companyPhone) setCompanyPhone(saved.companyPhone);
    if (saved.companyAddress) setCompanyAddress(saved.companyAddress);
    if (saved.heritage) setHeritage(saved.heritage);
    if (saved.shippingPolicy) setShippingPolicy(saved.shippingPolicy);
    if (saved.returnPolicy) setReturnPolicy(saved.returnPolicy);
    if (saved.brandColor) setBrandColor(saved.brandColor);
    if (saved.logoUrl) setLogoUrl(saved.logoUrl);
    if (saved.taxRate) setTaxRate(saved.taxRate);
    if (saved.enableMCX !== undefined) setEnableMCX(saved.enableMCX);
    if (saved.mcxPhone) setMcxPhone(saved.mcxPhone);
    if (saved.enableIBAN !== undefined) setEnableIBAN(saved.enableIBAN);
    if (saved.bankName) setBankName(saved.bankName);
    if (saved.bankIBAN) setBankIBAN(saved.bankIBAN);
    if (saved.shippingLuanda) setShippingLuanda(saved.shippingLuanda);
    if (saved.shippingProvinces) setShippingProvinces(saved.shippingProvinces);
    if (saved.freeShippingThreshold) setFreeShippingThreshold(saved.freeShippingThreshold);

    const syncFromDB = async () => {
      try {
        const { fetchAllAppSettings } = await import('../../services/supabase');
        const settings = await fetchAllAppSettings();
        if (settings.company_name) setCompanyName(settings.company_name);
        if (settings.company_phone) setCompanyPhone(settings.company_phone);
        if (settings.company_address) setCompanyAddress(settings.company_address);
        if (settings.heritage) setHeritage(settings.heritage);
        if (settings.shipping_policy) setShippingPolicy(settings.shipping_policy);
        if (settings.return_policy) setReturnPolicy(settings.return_policy);
        if (settings.brand_color) setBrandColor(settings.brand_color);
        if (settings.logo_url) setLogoUrl(settings.logo_url);
        if (settings.tax_rate) setTaxRate(settings.tax_rate);
        if (settings.shipping_luanda) setShippingLuanda(settings.shipping_luanda);
        if (settings.shipping_provinces) setShippingProvinces(settings.shipping_provinces);
        if (settings.free_shipping_threshold) setFreeShippingThreshold(settings.free_shipping_threshold);

        // Settings missing in previous logic
        if (settings.enable_mcx !== undefined) setEnableMCX(settings.enable_mcx === 'true');
        if (settings.mcx_phone) setMcxPhone(settings.mcx_phone);
        if (settings.enable_iban !== undefined) setEnableIBAN(settings.enable_iban === 'true');
        if (settings.bank_name) setBankName(settings.bank_name);
        if (settings.bank_iban) setBankIBAN(settings.bank_iban);
      } catch (e) {
        console.error("Error syncing settings from DB:", e);
      }
    };
    syncFromDB();
  }, []);

  const allTabs = [
    { name: 'Identidade & Atelier', icon: 'auto_awesome', perm: 'settings' },
    { name: 'Aparência da Loja', icon: 'palette', perm: 'settings' },
    { name: 'Inteligência IA', icon: 'psychology', perm: 'settings' },
    { name: 'Apoio ao Cliente', icon: 'support_agent', perm: 'settings' },
    { name: 'Pagamentos & Taxas', icon: 'payments', perm: 'finance' },
    { name: 'Logística de Envio', icon: 'local_shipping', perm: 'settings' },
    { name: 'Segurança & Acesso', icon: 'security', perm: 'all' },
    { name: 'Capacidade & Infra', icon: 'database', perm: 'settings' }
  ];

  const visibleTabs = allTabs.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    if (t.perm === 'all') return true;
    // @ts-ignore
    return currentUser.permissions?.[t.perm];
  });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setPasswordSuccess("Senha atualizada com sucesso!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao atualizar senha.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    if (!userName.trim()) {
      setNameError("O nome não pode estar vazio.");
      return;
    }

    if (!currentUser) return;

    setIsUpdatingName(true);
    try {
      const { updateEmployeeProfile } = await import('../../services/supabase');
      await updateEmployeeProfile(currentUser.id, { full_name: userName });
      setNameSuccess("Nome atualizado com sucesso!");
      setCurrentUser({ ...currentUser, full_name: userName });
    } catch (err: any) {
      setNameError(err.message || "Erro ao atualizar nome.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const loadStorageMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await fetchStorageMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading metrics", err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 7) {
      loadStorageMetrics();
      const interval = setInterval(loadStorageMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        companyName, companyPhone, companyAddress, heritage, shippingPolicy, returnPolicy,
        brandColor, logoUrl, taxRate, enableMCX, mcxPhone, enableIBAN, bankName, bankIBAN,
        shippingLuanda, shippingProvinces, freeShippingThreshold
      };

      // Update LocalStorage
      localStorage.setItem('brilho_essenza_settings', JSON.stringify(settings));
      localStorage.setItem('brilho_essenza_settings_updated', Date.now().toString());

      // Sync to Database
      const dbSyncs = [
        updateAppSetting('company_name', companyName),
        updateAppSetting('company_phone', companyPhone),
        updateAppSetting('company_address', companyAddress),
        updateAppSetting('heritage', heritage),
        updateAppSetting('shipping_policy', shippingPolicy),
        updateAppSetting('return_policy', returnPolicy),
        updateAppSetting('brand_color', brandColor),
        updateAppSetting('logo_url', logoUrl || ''),
        updateAppSetting('tax_rate', taxRate),
        updateAppSetting('enable_mcx', String(enableMCX)),
        updateAppSetting('mcx_phone', mcxPhone),
        updateAppSetting('enable_iban', String(enableIBAN)),
        updateAppSetting('bank_name', bankName),
        updateAppSetting('bank_iban', bankIBAN),
        updateAppSetting('shipping_luanda', shippingLuanda),
        updateAppSetting('shipping_provinces', shippingProvinces),
        updateAppSetting('free_shipping_threshold', freeShippingThreshold)
      ];

      await Promise.all(dbSyncs);

      const toast = document.createElement('div');
      toast.className = "fixed bottom-8 right-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest z-[200] shadow-2xl border border-primary/20 animate-slide-in";
      toast.innerText = "Configurações do Atelier Atualizadas";
      document.body.appendChild(toast);
      setLogoUrl(settings.logoUrl || null);
      if (settings.brandColor) setBrandColor(settings.brandColor);
      if (settings.taxRate) setTaxRate(settings.taxRate);
      if (settings.enableMCX !== undefined) setEnableMCX(settings.enableMCX);
      if (settings.mcxPhone) setMcxPhone(settings.mcxPhone);
      if (settings.enableIBAN !== undefined) setEnableIBAN(settings.enableIBAN);
      if (settings.bankName) setBankName(settings.bankName);
      if (settings.bankIBAN) setBankIBAN(settings.bankIBAN);
      if (settings.shippingLuanda) setShippingLuanda(settings.shippingLuanda);
      if (settings.shippingProvinces) setShippingProvinces(settings.shippingProvinces);
      if (settings.freeShippingThreshold) setFreeShippingThreshold(settings.freeShippingThreshold);

      // Save to localStorage immediately to ensure consistency
      localStorage.setItem('brilho_essenza_settings', JSON.stringify(settings));
      localStorage.setItem('brilho_essenza_settings_updated', Date.now().toString());

      alert("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar no banco de dados:", error);
      alert(`Erro ao salvar no banco de dados: ${error.message || "Verifique sua conexão"}. Se você alterou o logo, tente uma imagem menor ou menos complexa.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingLogo(true);
        setLogoProgress(0);
        const processedBlob = await removeImageBackground(file, (p) => {
          setLogoProgress(Math.round(p * 100));
        });

        // Resize logo to max 800px to ensure it fits in DB payload
        const resizedBlob = await resizeImage(processedBlob, 800, 800);
        const base64 = await blobToBase64(resizedBlob);
        setLogoUrl(base64);
      } catch (error) {
        console.error("Erro no processamento da logo:", error);

        // Fallback: still try to resize even if background removal fails
        try {
          const resizedBlob = await resizeImage(file, 800, 800);
          const base64 = await blobToBase64(resizedBlob);
          setLogoUrl(base64);
        } catch (resizeErr) {
          const reader = new FileReader();
          reader.onloadend = () => setLogoUrl(reader.result as string);
          reader.readAsDataURL(file);
        }
      } finally {
        setIsProcessingLogo(false);
      }
    }
  };

  const handleBulkVectorize = async () => {
    if (!confirm("Isso irá processar TODAS as imagens de produtos para remover o fundo automaticamente. Deseja continuar?")) return;
    try {
      setIsBulkProcessing(true);
      setBulkErrors(0);
      setBulkCurrent(0);
      const { data: products, error } = await supabase.from('products').select('id, image, name');
      if (error) throw error;
      if (!products || products.length === 0) {
        alert("Nenhum produto cadastrado.");
        return;
      }
      setBulkTotal(products.length);

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setBulkCurrent(i + 1);
        if (product.image) {
          try {
            const vectorImage = await removeImageBackground(product.image);
            const base64 = await blobToBase64(vectorImage);
            await supabase.from('products').update({ image: base64 }).eq('id', product.id);
          } catch (err) {
            setBulkErrors(prev => prev + 1);
          }
        }
      }
      if (logoUrl) {
        try {
          const vectorLogo = await removeImageBackground(logoUrl);
          const base64 = await blobToBase64(vectorLogo);
          setLogoUrl(base64);
          await updateAppSetting('logo_url', base64);
        } catch (err) { }
      }
      alert(`Processamento concluído! ${products.length - bulkErrors} imagens processadas.`);
    } catch (error: any) {
      alert("Erro no processamento: " + error.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Identidade Corporativa (Nome da Marca)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Manifesto & Herança (Bio da Marca)</label>
                <textarea
                  rows={4}
                  value={heritage}
                  onChange={e => setHeritage(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
                />
                <p className="text-[10px] text-gray-500 italic">Este texto aparecerá na seção "Sobre Nós" e no rodapé institucional.</p>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-10 animate-fade-in">
            {/* Logo Management */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="material-symbols-outlined text-blue-600">branding_watermark</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Identidade Visual (Logo)</h4>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-64 aspect-square bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group">
                  {logoUrl ? (
                    <img src={logoUrl} className={`w-full h-full object-contain p-6 ${isProcessingLogo ? 'opacity-20' : ''}`} />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
                  )}
                  {isProcessingLogo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-sm">
                      <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-[10px] font-bold text-blue-600">{logoProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-wide font-medium">Use arquivos PNG ou SVG com fundo transparente. Nossa IA removerá automaticamente qualquer ruído visual.</p>
                  <label className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-widest rounded cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm">
                    Carregar Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* Brand Color Management */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="material-symbols-outlined text-blue-600">palette</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Personalização Cromática</h4>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                {['#2563eb', '#1e293b', '#059669', '#dc2626', '#d97706', '#7c3aed'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={`size-10 rounded border-2 transition-all ${brandColor === c ? 'border-blue-600 scale-110 shadow-md ring-2 ring-blue-500/20' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="size-10 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center relative group">
                  <span className="material-symbols-outlined text-gray-400 text-sm group-hover:text-blue-600">colorize</span>
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HEX:</span>
                  <span className="text-xs font-mono font-bold text-blue-600">{brandColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="material-symbols-outlined text-blue-600">psychology</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Motor de Inteligência Artificial</h4>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Utilize o motor Brilho-AI para remover fundos de imagens e vetorizar o seu catálogo em tempo real.
                </p>
              </div>

              <div className="p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded flex flex-col items-center text-center gap-6">
                <span className="material-symbols-outlined text-5xl text-blue-600 animate-pulse">auto_fix_high</span>
                <div>
                  <h5 className="text-sm font-bold uppercase tracking-tight">Vetorizador de Catálogo Bulk</h5>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Processamento em lote de todos os produtos do atelier</p>
                </div>

                {isBulkProcessing ? (
                  <div className="w-full max-w-md space-y-3">
                    <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(bulkCurrent / (bulkTotal || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sincronizando {bulkCurrent} / {bulkTotal} ativos...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleBulkVectorize}
                    className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded shadow-lg hover:bg-blue-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Iniciar Otimização Global
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Canais de Apoio ao Cliente</h4>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">WhatsApp de Suporte Técnico</label>
                  <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Política de Envio (Termos)</label>
                  <textarea rows={3} value={shippingPolicy} onChange={e => setShippingPolicy(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Fiscalidade & Operações Financeiras</h4>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Taxa de IVA Aplicável (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Logística & Zonas de Entrega</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded">
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">Luanda (Província Sede)</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Entrega Base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kz</span>
                    <input type="number" value={shippingLuanda} onChange={e => setShippingLuanda(e.target.value)} className="w-24 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 p-2 rounded text-right font-bold text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        const formatSize = (bytes: number) => {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const dbPercent = metrics ? (metrics.database_size / metrics.database_limit) * 100 : 0;
        const storagePercent = metrics ? (metrics.storage_size / metrics.storage_limit) * 100 : 0;

        return (
          <div className="flex flex-col gap-10 animate-fade-in pb-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-600">database</span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Capacidade de Infraestrutura</h4>
                </div>
                <button 
                  onClick={loadStorageMetrics}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors group"
                >
                  <span className={`material-symbols-outlined text-lg text-gray-400 group-hover:text-blue-600 ${isLoadingMetrics ? 'animate-spin' : ''}`}>refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Database Metrics */}
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Banco de Dados</h5>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">Core Engine</p>
                    </div>
                    <span className="material-symbols-outlined text-blue-100 dark:text-blue-900/40 text-4xl">storage</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {metrics ? formatSize(metrics.database_size) : '---'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Limite: {metrics ? formatSize(metrics.database_limit) : '---'}
                      </p>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${dbPercent > 90 ? 'bg-red-500' : dbPercent > 70 ? 'bg-orange-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(dbPercent, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dbPercent.toFixed(1)}% Usado</span>
                      <span className={`text-[9px] font-bold uppercase p-1 px-2 rounded ${dbPercent > 90 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {dbPercent > 90 ? 'Crítico' : 'Estável'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Storage Metrics */}
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Armazenamento</h5>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">Media Assets</p>
                    </div>
                    <span className="material-symbols-outlined text-blue-100 dark:text-blue-900/40 text-4xl">cloud_queue</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {metrics ? formatSize(metrics.storage_size) : '---'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Limite: {metrics ? formatSize(metrics.storage_limit) : '---'}
                      </p>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-orange-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(storagePercent, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{storagePercent.toFixed(1)}% Usado</span>
                      <span className="text-[9px] font-bold uppercase p-1 px-2 rounded bg-blue-500/10 text-blue-500">
                        Sincronizando
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-600 mt-1">info</span>
                <div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase tracking-tight">Otimização em Tempo Real</p>
                  <p className="text-[11px] text-blue-700/70 dark:text-blue-300/60 mt-1 leading-relaxed">
                    O armazenamento é monitorado a cada 30 segundos. Para liberar espaço, você pode utilizar a ferramenta de <strong>Vetorização IA</strong> na aba Inteligência IA para comprimir imagens antigas do catálogo.
                  </p>
                </div>
              </div>

              {metrics && (
                <p className="text-center text-[10px] text-gray-400 uppercase font-black tracking-[0.3em] py-4">
                  Última Sincronização: {new Date(metrics.last_updated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        );
      case 6:
        if (!currentUser && activeTab === 6) {
          return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Autenticando Perfil...</p>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-10 animate-fade-in">
            {/* Identity Form */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="material-symbols-outlined text-blue-600">badge</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Credenciais do Utilizador</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID de Acesso / Email</p>
                  <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-200 uppercase">{currentUser?.email || 'OFFLINE'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nível de Permissão</p>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">{currentUser?.role || 'CONVIDADO'}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateName} className="space-y-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nome de Exibição</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                {nameError && <p className="text-red-500 text-[10px] font-bold uppercase">{nameError}</p>}
                {nameSuccess && <p className="text-green-500 text-[10px] font-bold uppercase">{nameSuccess}</p>}
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-widest rounded shadow hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-all disabled:opacity-50"
                >
                  {isUpdatingName ? 'Sincronizando...' : 'Atualizar Identidade'}
                </button>
              </form>
            </div>

            {/* Password Reset */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="material-symbols-outlined text-blue-600">lock_reset</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Segurança de Acesso</h4>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nova Chave de Acesso</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirmar Chave</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                {passwordError && <p className="text-red-500 text-[10px] font-bold uppercase">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-500 text-[10px] font-bold uppercase">{passwordSuccess}</p>}

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full px-6 py-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded shadow hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Resetando...' : 'Efetuar Reset de Segurança'}
                </button>
              </form>
            </div>

            <div className="flex justify-start">
              <button
                onClick={async () => {
                  const { signOut } = await import('../../services/supabase');
                  try {
                    await signOut();
                    localStorage.removeItem('user_profile');
                    window.location.href = '/';
                  } catch (err) {
                    window.location.href = '/';
                  }
                }}
                className="text-gray-400 hover:text-red-500 flex items-center gap-2 font-bold uppercase text-[9px] tracking-widest transition-colors"
              >
                <span className="material-symbols-outlined !text-sm">logout</span>
                Terminar Sessão Operacional
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Configurações do Sistema</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Gestão global de identidade, segurança e logística</p>
        </div>
        {activeTab !== 6 && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Sincronizando...' : 'Publicar Alterações'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 shrink-0 lg:w-64">
          {visibleTabs.map((tab) => (
            <button
              key={tab.originalIndex}
              onClick={() => setActiveTab(tab.originalIndex)}
              className={`flex items-center gap-3 px-4 py-3 rounded text-left transition-all whitespace-nowrap ${activeTab === tab.originalIndex ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-[#0d1117] rounded border border-gray-200 dark:border-white/10 p-6 lg:p-10 shadow-sm min-h-[500px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
