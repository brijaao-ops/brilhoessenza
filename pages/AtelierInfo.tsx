
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const AtelierInfo: React.FC = () => {
  const { section } = useParams<{ section: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  const sections: Record<string, { title: string; subtitle: string; content: string; image: string }> = {
    'heranca': {
      title: 'Nossa Herança',
      subtitle: 'O Legado do Luxo Angolano desde 1994',
      image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=1200',
      content: `Fundada no coração de Luanda em 1994, a Brilho Essenza nasceu de um desejo profundo: capturar a alma vibrante de Angola e destilá-la em fragrâncias de prestígio mundial. O que começou como um pequeno atelier artesanal em Talatona evoluiu para se tornar a referência máxima em cosmética de luxo no país.\n\nNossa história é escrita com paixão pela excelência. Cada frasco carrega décadas de conhecimento transmitido entre mestres perfumistas, combinando a tradição europeia com a riqueza botânica africana. Na Brilho Essenza, não vendemos apenas produtos; preservamos um estilo de vida sofisticado que honra nossas raízes enquanto olha para o futuro.`
    },
    'sustentabilidade': {
      title: 'Sustentabilidade',
      subtitle: 'Beleza que Honra a Natureza',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200',
      content: `Para nós, o verdadeiro luxo é consciente. Acreditamos que a beleza não deve custar o futuro do nosso planeta. Por isso, implementamos o programa "Eco-Luxo Essenza", focado em três pilares fundamentais: extração ética de matérias-primas, embalagens 100% recicláveis e apoio direto às comunidades locais que protegem nossa biodiversidade.\n\nTrabalhamos incansavelmente para reduzir nossa pegada de carbono, otimizando nossa logística em todo o território nacional e priorizando ingredientes colhidos de forma sustentável. Escolher Brilho Essenza é optar por um amanhã mais verde, sem nunca comprometer a sofisticação.`
    },
    'ingredientes': {
      title: 'Ingredientes Nobres',
      subtitle: 'A Alquimia da Exclusividade',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      content: `A alma de nossas criações reside na pureza de seus componentes. Viajamos o mundo — das plantações de rosas em Grasse aos desertos da Namíbia — em busca do inatingível. Nossos perfumistas selecionam apenas o Oud mais raro, o Âmbar mais profundo e as essências botânicas angolanas mais puras.\n\nCada ingrediente é tratado como uma joia preciosa. Através de processos de extração a frio e destilação molecular, preservamos a integridade molecular de cada nota, garantindo que sua experiência olfativa seja tão rica quanto a própria natureza. Na Brilho Essenza, a qualidade não é um padrão, é nossa obsessão.`
    }
  };

  const current = sections[section || 'heranca'] || sections['heranca'];

  return (
    <div className="py-20 animate-slide-in">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 gap-2">
          <Link to="/" className="hover:text-primary transition-colors">Atelier</Link>
          <span>/</span>
          <span className="text-black dark:text-white">{current.title}</span>
        </nav>

        <header className="mb-16">
          <span className="text-primary text-xs font-black uppercase tracking-[0.4em] mb-4 block">{current.subtitle}</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-[#1c1a0d] dark:text-white leading-none mb-10">{current.title}</h1>
          <div className="w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5">
            <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
          </div>
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {current.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-xl leading-relaxed text-gray-600 dark:text-gray-400 font-medium mb-8">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
          <Link to="/" className="bg-black dark:bg-white text-white dark:text-black font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
            Voltar à Vitrine
          </Link>
          <div className="flex gap-4">
            {Object.keys(sections).map(key => key !== section && (
              <Link key={key} to={`/atelier/${key}`} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">
                Ler sobre {sections[key].title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtelierInfo;
