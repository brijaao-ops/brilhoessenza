
import React from 'react';

const AdminLogistics: React.FC = () => {
  const shipments = [
    { order: '#BE-90211', carrier: 'DHL Express', region: 'Talatona, Luanda', status: 'Em Trânsito' },
    { order: '#BE-90215', carrier: 'Manda-me Delivery', region: 'Central Luanda', status: 'Preparando' },
    { order: '#BE-90218', carrier: 'DHL Express', region: 'Benguela', status: 'Aguardando Coleta' },
  ];

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Envios</span></h2>
          <p className="text-sm text-gray-500 font-medium">Rastreamento de encomendas e parceiros logísticos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] p-8">
           <h4 className="font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary text-sm">local_shipping</span> Entregas Ativas
           </h4>
           <div className="flex flex-col gap-6">
             {shipments.map((s, i) => (
               <div key={i} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-[#222115]">
                 <div>
                    <p className="font-black text-sm uppercase text-primary">{s.order}</p>
                    <p className="text-xs font-bold text-gray-500">{s.carrier} • {s.region}</p>
                 </div>
                 <span className="px-3 py-1 bg-primary text-black text-[9px] font-black uppercase tracking-widest rounded-full">{s.status}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-black dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] p-8 text-white">
           <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Painel de Operações</h4>
           <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-sm font-bold">Entrega no Mesmo Dia (Luanda)</span>
                <div className="size-10 bg-green-500 rounded-full flex items-center justify-center text-black font-black text-xs">ON</div>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-sm font-bold">Seguro de Carga VIP</span>
                <div className="size-10 bg-green-500 rounded-full flex items-center justify-center text-black font-black text-xs">ON</div>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-bold">Envio Provincial (Benguela/Huambo)</span>
                <div className="size-10 bg-green-500 rounded-full flex items-center justify-center text-black font-black text-xs">ON</div>
              </div>
           </div>
           <button className="w-full bg-white text-black font-black py-4 rounded-xl mt-8 uppercase tracking-widest text-[10px] hover:scale-105 transition-all">Configurar Zonas de Entrega</button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogistics;
