import React, { useState, useEffect } from 'react';
import { supabase, UserProfile, fetchProfile, updateAppSetting, updateUserPassword } from '../../services/supabase';
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
    { name: 'Segurança & Acesso', icon: 'security', perm: 'all' }
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
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight mb-6 lg:mb-8">Narrativa do Atelier</h4>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Marca</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Herança & Filosofia</label>
                  <textarea rows={4} value={heritage} onChange={e => setHeritage(e.target.value)} className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            {/* Seção de Logo */}
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-2xl">branding_watermark</span>
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight">Logotipo do Atelier</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">A face da sua marca em todos os dispositivos</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-full md:w-[8cm] h-40 bg-gray-100 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-[#222115] flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-inner">
                  {logoUrl ? <img src={logoUrl} className={`w-full h-full object-contain p-4 ${isProcessingLogo ? 'opacity-30 blur-sm' : ''}`} /> : <span className="material-symbols-outlined !text-4xl text-gray-300">image</span>}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" onChange={handleLogoUpload} disabled={isProcessingLogo} />
                  {isProcessingLogo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-50">
                      <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{logoProgress}%</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed">Carregue uma imagem em alta resolução. A nossa IA irá processar e otimizar para o melhor desempenho.</p>
                  <label className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-black transition-all shadow-xl hover:scale-105 active:scale-95 text-center">
                    Selecionar Nova Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* Seção de Cores */}
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-2xl">palette</span>
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight">Paleta de Cores</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Defina a cor que personifica o luxo da sua marca</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-4 items-center">
                  {['#f2d00d', '#1c1a0d', '#d4af37', '#e5e5e5', '#ff4d4d', '#4d79ff'].map(c => (
                    <button
                      key={c}
                      onClick={() => setBrandColor(c)}
                      className={`size-12 rounded-full border-4 shadow-lg transition-transform hover:scale-110 ${brandColor === c ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-white dark:border-[#222115]'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="size-12 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center relative bg-gray-50 dark:bg-white/5 overflow-hidden group">
                    <span className="material-symbols-outlined text-gray-400 !text-xl group-hover:text-primary transition-colors">colorize</span>
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#08112e] rounded-xl border border-gray-100 dark:border-[#222115] flex items-center gap-4 w-fit">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Código Hex:</p>
                  <p className="text-sm font-black text-primary font-mono lowercase">{brandColor}</p>
                </div>
              </div>
            </div>

            {/* Atalho IA */}
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-3xl">psychology</span>
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-primary">Ferramentas de IA</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Otimização visual automatizada</p>
                </div>
              </div>
              <div className="p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div>
                  <h5 className="font-black uppercase text-xs tracking-tight">Otimizador de Catálogo IA</h5>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Vetorizar todas as imagens de produtos para um visual HD</p>
                </div>
                <button onClick={() => setActiveTab(2)} className="bg-primary text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-[9px] shadow-xl hover:scale-105 transition-all">
                  Gerir Inteligência
                </button>
              </div>
            </div>
          </div>
        );
      case 2: // Inteligência IA
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-3xl">psychology</span>
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight">Inteligência Artificial</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Motor de vetorização e automação</p>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    A IA permite remover fundos de imagens automaticamente para um visual limpo em todo o site.
                  </p>
                </div>
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                  <div className="flex items-center gap-5 mb-6">
                    <span className="material-symbols-outlined text-primary !text-5xl">auto_fix_high</span>
                    <div>
                      <h5 className="font-black uppercase text-sm tracking-tight">Otimizador de Catálogo IA</h5>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Processar todas as imagens existentes</p>
                    </div>
                  </div>
                  {isBulkProcessing ? (
                    <div className="flex flex-col gap-4">
                      <div className="w-full h-4 bg-gray-100 dark:bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(bulkCurrent / (bulkTotal || 1)) * 100}%` }}></div>
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Processando {bulkCurrent} de {bulkTotal} imagens...</p>
                    </div>
                  ) : (
                    <button onClick={handleBulkVectorize} className="w-full bg-primary text-black font-black py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                      <span className="material-symbols-outlined !text-xl">magic_button</span>
                      Vetorizar Todo o Catálogo Agora
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight mb-6 lg:mb-8">Políticas de Serviço</h4>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp de Suporte</label>
                  <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Política de Envio</label>
                  <textarea rows={3} value={shippingPolicy} onChange={e => setShippingPolicy(e.target.value)} className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight mb-6 lg:mb-8">Fiscalidade & Moeda</h4>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa de IVA (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight mb-6 lg:mb-8">Zonas de Entrega</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#08112e] rounded-xl">
                  <label className="text-xs font-black uppercase tracking-widest">Luanda (Capital)</label>
                  <input type="number" value={shippingLuanda} onChange={e => setShippingLuanda(e.target.value)} className="w-32 bg-white dark:bg-[#0d1840] p-2 rounded-lg text-right font-bold" />
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        if (!currentUser && activeTab === 6) {
          return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando Perfil de Segurança...</p>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-6 lg:gap-8 animate-slide-in">
            {/* Perfil Atual */}
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-2xl">account_circle</span>
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight">O Meu Perfil</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Dados de identificação no Atelier</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-gray-50 dark:bg-[#08112e] rounded-2xl border border-gray-100 dark:border-[#222115]">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email de Acesso</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentUser?.email || 'N/A'}</p>
                  </div>
                  <div className="p-5 bg-gray-50 dark:bg-[#08112e] rounded-2xl border border-gray-100 dark:border-[#222115]">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Função / Role</p>
                    <p className="text-sm font-bold text-primary uppercase">{currentUser?.role || 'N/A'}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateName} className="flex flex-col gap-4 max-w-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  {nameError && <p className="text-red-500 text-[10px] font-bold uppercase">{nameError}</p>}
                  {nameSuccess && <p className="text-green-500 text-[10px] font-bold uppercase">{nameSuccess}</p>}
                  <button
                    type="submit"
                    disabled={isUpdatingName}
                    className="bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all w-fit px-8"
                  >
                    {isUpdatingName ? 'Gravando...' : 'Atualizar Nome'}
                  </button>
                </form>
              </div>
            </div>

            {/* Alterar Senha */}
            <div className="bg-white dark:bg-[#0d1840] p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary !text-2xl">lock_reset</span>
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight">Alterar Senha</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Mantenha a sua conta protegida</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6 max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-50 dark:bg-[#08112e] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {passwordError && <p className="text-red-500 text-[10px] font-bold uppercase">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-500 text-[10px] font-bold uppercase">{passwordSuccess}</p>}

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-primary text-black font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all mt-2"
                >
                  {isUpdatingPassword ? 'A Processar...' : 'Atualizar Dados de Acesso'}
                </button>
              </form>
            </div>

            {/* Logout Secundário */}
            <div className="flex justify-start">
              <button onClick={async () => {
                const { signOut } = await import('../../services/supabase');
                try {
                  await signOut();
                  localStorage.removeItem('user_profile');
                  window.location.href = '/';
                } catch (err) {
                  window.location.href = '/';
                }
              }} className="text-gray-400 hover:text-red-500 flex items-center gap-2 font-black uppercase text-[9px] tracking-widest transition-colors">
                <span className="material-symbols-outlined !text-sm">logout</span>
                Terminar Sessão de Segurança
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="hidden md:block mb-8 lg:mb-12">
        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">Mestre de <span className="text-primary italic">Configurações</span></h2>
        <p className="text-[11px] lg:text-sm text-gray-500 font-medium">Controle total sobre o Atelier.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 shrink-0 border-b lg:border-b-0 border-gray-100 dark:border-white/5 mb-4 lg:mb-0">
          {visibleTabs.map((tab) => (
            <button key={tab.originalIndex} onClick={() => setActiveTab(tab.originalIndex)} className={`text-left px-5 lg:px-6 py-3.5 lg:py-5 rounded-xl lg:rounded-2xl font-bold flex items-center gap-3 lg:gap-4 transition-all whitespace-nowrap lg:whitespace-normal ${activeTab === tab.originalIndex ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-primary/5'}`}>
              <span className="material-symbols-outlined !text-xl lg:!text-base">{tab.icon}</span>
              <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
            </button>
          ))}
        </nav>
        <div className="lg:col-span-2 flex flex-col gap-8">
          {renderTabContent()}
          {activeTab !== 6 && (
            <div className="flex justify-end pt-4">
              <button onClick={handleSave} disabled={isSaving} className={`bg-black dark:bg-white text-white dark:text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all ${isSaving ? 'animate-pulse' : ''}`}>
                {isSaving ? 'Gravando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
