import React, { useState, useEffect } from 'react';
import { supabase, UserProfile, fetchTeam, createEmployee, UserPermissions, updateEmployeePermissions, deleteEmployee, fetchProfile, updateAppSetting, fetchAppSetting } from '../../services/supabase';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    // Check Profile for Permissions & First Login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(p => {
          setCurrentUser(p);
        });
      } else {
        // Fallback for Admin forced session if any
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          setCurrentUser(p);
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

    // Load New Settings
    if (saved.taxRate) setTaxRate(saved.taxRate);
    if (saved.enableMCX !== undefined) setEnableMCX(saved.enableMCX);
    if (saved.mcxPhone) setMcxPhone(saved.mcxPhone);
    if (saved.enableIBAN !== undefined) setEnableIBAN(saved.enableIBAN);
    if (saved.bankName) setBankName(saved.bankName);
    if (saved.bankIBAN) setBankIBAN(saved.bankIBAN);
    if (saved.shippingLuanda) setShippingLuanda(saved.shippingLuanda);
    if (saved.shippingProvinces) setShippingProvinces(saved.shippingProvinces);
    if (saved.freeShippingThreshold) setFreeShippingThreshold(saved.freeShippingThreshold);
    if (saved.freeShippingThreshold) setFreeShippingThreshold(saved.freeShippingThreshold);

    // Sync with Database
    fetchAppSetting('company_phone').then(phone => {
      if (phone) setCompanyPhone(phone);
    });
  }, []);

  const allTabs = [
    { name: 'Identidade & Atelier', icon: 'auto_awesome', perm: 'settings' },
    { name: 'Aparência da Loja', icon: 'palette', perm: 'settings' },
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

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const settings = {
        companyName,
        companyPhone,
        companyAddress,
        heritage,
        shippingPolicy,
        returnPolicy,
        brandColor,
        logoUrl,
        taxRate,
        enableMCX, mcxPhone,
        enableIBAN, bankName, bankIBAN,
        shippingLuanda, shippingProvinces, freeShippingThreshold
      };

      localStorage.setItem('brilho_essenza_settings', JSON.stringify(settings));

      // Save critical public settings to DB
      updateAppSetting('company_phone', companyPhone).catch(err => console.error("DB Sync Error:", err));

      const toast = document.createElement('div');
      toast.className = "fixed bottom-8 right-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest z-[200] shadow-2xl border border-primary/20 animate-slide-in";
      toast.innerText = "Configurações do Atelier Atualizadas";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }, 800);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // O Atelier
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Narrativa do Atelier</h4>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Marca</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Herança & Filosofia (Sobre Nós)</label>
                  <textarea rows={4} value={heritage} onChange={e => setHeritage(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço Principal</label>
                  <textarea rows={2} value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        );
      case 1: // Aparência
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Identidade Visual</h4>
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-10">
                  <div className="size-32 bg-gray-100 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-[#222115] flex items-center justify-center relative group cursor-pointer overflow-hidden">
                    {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <span className="material-symbols-outlined !text-4xl text-gray-300">image</span>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Logotipo do Atelier</p>
                    <label className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-black transition-colors">
                      Mudar Logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Cor de Destaque (Brand Color)</label>
                  <div className="flex gap-4 items-center">
                    {['#f2d00d', '#1c1a0d', '#d4af37', '#e5e5e5'].map(c => (
                      <button key={c} onClick={() => setBrandColor(c)} className={`size-10 rounded-full border-4 ${brandColor === c ? 'border-primary' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="size-10 rounded-full cursor-pointer bg-transparent border-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2: // Apoio ao Cliente
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Políticas de Serviço</h4>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp de Suporte (Concierge)</label>
                  <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Política de Envio & Logística</label>
                  <textarea rows={3} value={shippingPolicy} onChange={e => setShippingPolicy(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Política de Devolução (Luxo)</label>
                  <textarea rows={3} value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        );
      case 3: // Pagamentos & Taxas
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Fiscalidade & Moeda</h4>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa de IVA (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                  <p className="text-[10px] text-gray-400">O padrão em Angola é 14%.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Métodos de Pagamento</h4>
              <div className="flex flex-col gap-8">

                {/* MCX Express */}
                <div className="p-6 rounded-2xl border border-gray-100 dark:border-[#222115] bg-gray-50/50 dark:bg-[#0f0e08]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">payments</span>
                      <span className="font-black text-sm uppercase">Multicaixa Express</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableMCX} onChange={e => setEnableMCX(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {enableMCX && (
                    <div className="animate-slide-in">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telemóvel Associado (Express)</label>
                      <input type="text" value={mcxPhone} onChange={e => setMcxPhone(e.target.value)} placeholder="923 000 000" className="w-full mt-2 bg-white dark:bg-[#15140b] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  )}
                </div>

                {/* Transferência Bancária */}
                <div className="p-6 rounded-2xl border border-gray-100 dark:border-[#222115] bg-gray-50/50 dark:bg-[#0f0e08]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">account_balance</span>
                      <span className="font-black text-sm uppercase">Transferência / IBAN</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableIBAN} onChange={e => setEnableIBAN(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {enableIBAN && (
                    <div className="flex flex-col gap-4 animate-slide-in">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Banco</label>
                        <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: Banco BAI" className="w-full bg-white dark:bg-[#15140b] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordenada Bancária (IBAN)</label>
                        <input type="text" value={bankIBAN} onChange={e => setBankIBAN(e.target.value)} placeholder="AO06 ...." className="w-full bg-white dark:bg-[#15140b] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      case 4: // Logística
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Zonas de Entrega</h4>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f0e08] rounded-xl">
                  <label className="text-xs font-black uppercase tracking-widest">Luanda (Capital)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={shippingLuanda} onChange={e => setShippingLuanda(e.target.value)} className="w-32 bg-white dark:bg-[#15140b] p-2 rounded-lg text-right font-bold outline-none border border-transparent focus:border-primary" />
                    <span className="text-[10px] font-bold">Kz</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f0e08] rounded-xl">
                  <label className="text-xs font-black uppercase tracking-widest">Outras Províncias</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={shippingProvinces} onChange={e => setShippingProvinces(e.target.value)} className="w-32 bg-white dark:bg-[#15140b] p-2 rounded-lg text-right font-bold outline-none border border-transparent focus:border-primary" />
                    <span className="text-[10px] font-bold">Kz</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Ofertas de Frete</h4>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frete Grátis para pedidos acima de:</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} className="flex-1 bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                  <span className="font-black text-sm">Kz</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 5: // Segurança
        return (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
              <h4 className="text-xl font-black uppercase tracking-tight mb-8">Credenciais de Acesso</h4>
              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl mb-6">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold">Atenção: A alteração da palavra-passe é imediata. Você precisará fazer login novamente com a nova credencial.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Palavra-passe</label>
                  <input
                    type="password"
                    id="new-password"
                    placeholder="Mínimo 6 caracteres"
                    className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    onChange={(e) => {
                      // Storing in a temporary window variable or state would be better, but for this 'bulk save' flow we need to adapt handleSave or make this immediate.
                      // Given the current architecture where handleSave dumps everything to localStorage, we need a separate handler for Password.
                      // Let's attach it to a dataset or specific state if we want to batch it, OR add a specific button here.
                    }}
                  />
                </div>
                <button
                  onClick={async () => {
                    const input = document.getElementById('new-password') as HTMLInputElement;
                    if (input && input.value.length >= 6) {
                      try {
                        // Dynamically import to ensure fresh services
                        const { updateUserPassword, markFirstLoginComplete, getCurrentUser } = await import('../../services/supabase');
                        await updateUserPassword(input.value);

                        const user = await getCurrentUser();
                        if (user) await markFirstLoginComplete(user.id);

                        alert("✅ Senha alterada com sucesso! Você será desconectado para entrar com a nova senha.");
                        input.value = "";
                        const { signOut } = await import('../../services/supabase');
                        await signOut();
                        window.location.href = '/#/admin'; // Redirect to login
                        window.location.reload();
                      } catch (e: any) {
                        alert("Erro ao atualizar: " + (e.message || e));
                      }
                    } else {
                      alert("⚠️ A senha deve ter no mínimo 6 caracteres.");
                    }
                  }}
                  className="bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform"
                >
                  Atualizar Credencial Agora
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Mestre de <span className="text-primary italic">Configurações</span></h2>
        <p className="text-sm text-gray-500 font-medium">Controle total sobre a experiência Brilho Essenza.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <nav className="flex flex-col gap-2">
          {visibleTabs.map((tab) => (
            <button key={tab.originalIndex} onClick={() => setActiveTab(tab.originalIndex)} className={`text-left px-6 py-5 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === tab.originalIndex ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-primary/5'}`}>
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
            </button>
          ))}
        </nav>
        <div className="lg:col-span-2 flex flex-col gap-8">
          {renderTabContent()}
          {activeTab !== 5 && (
            <div className="flex justify-end pt-4">
              <button onClick={handleSave} disabled={isSaving} className={`bg-black dark:bg-white text-white dark:text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all ${isSaving ? 'animate-pulse' : ''}`}>
                {isSaving ? 'Gravando Sintonização...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
