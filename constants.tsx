
import { Product, Order, InventoryAlert } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Oud Gold Edition',
    price: 245000.00,
    rating: 4,
    reviewsCount: 48,
    category: 'Fragrâncias',
    subCategory: 'Mistura Privada de Luxo',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-EudC_ZB40fWUzAdsumk83mDv-zO7G2_tXp7u8QuwrqVW9jCcNXtR5sPZlpZE9NnA8NkmtAjSiNkgGAqsPGv4vuYhcQp_ms6GJfIr-36aLKkiUW867wBfCTqGX2NmjbY_s8U2Wm_YUmk6503FOOjHtDxxenDapAPXv__dAvPv91rsF6pUHeuzRkUWSSBRVz9EQ_TJHGTOQu_d6cvezl65fvvhetkGYkh2VpTbT_8P0SaLCwmuq6ag6DUf8VmJd_H81dK9csoYyzA',
    description: 'Uma jornada profunda e misteriosa pelas noites árabes, centrada no mais raro Oud e açafrão dourado.',
    stock: 24,
    bestSeller: true,
    notes: {
      top: 'Açafrão, Bergamota e Pimenta Rosa',
      heart: 'Rosa Damascena, Madeira de Oud e Cedro',
      base: 'Âmbar Cinzento, Baunilha e Couro'
    }
  },
  {
    id: '2',
    name: 'Creme de Reparação Velvet',
    price: 89000.00,
    rating: 5,
    reviewsCount: 124,
    category: 'Cuidados com a Pele',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBuSxtXMnll-y8cwqQ6CAf_YE5GGR5JC26-Dr3swm216aeGvlDbmpOdgaBu0wwfYwkYP6hQMhK3jEm5MRNuTio4Olx0seEr5rwJwn8sYS-6slh3NdxStYBhizJKZCJp-YDQ7Xwz9vyYb7thtbLelYubljEKE5Xae9BgaUgKCiyW3n95MAlDnuLpR7JoNvrn7lzEN53YFagbLQ4_GwCVO2mVk1C-W80rSpxoDxJw8ZTdnvNzsu1gb7um6VJZ4f-9cDDadcIv_gl8ME',
    description: 'Creme restaurador premium projetado para nutrir e proteger a pele com um acabamento suave como veludo.',
    stock: 50,
  },
  {
    id: '3',
    name: 'Rose Velour Parfum',
    price: 155000.00,
    rating: 4,
    reviewsCount: 67,
    category: 'Fragrâncias',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQpslU35_ia7w97UF54jWDg73q7wt2ws3iVrXRZ4ulsUlHLnGp8Hv-w8CQtKzr9ZbDNxk7kBzcEt3XRTAnjV86srIKpjWAlz2T8Rr0RjizO1bQRQH1WA76piFx4hzxGp5lwoTpl1KyercyfMIhduV13_9k-tce35PQg7n8OqlHIeIBUmwBz4HgucNWL6f7PjO42lCD-cRGzCs-n1iC7zhwB32MZyQ4ycziK7_bQNE7J3NWHVXC6ELzPUykHFV9HU3Uobn8Pm-I_5g',
    description: 'A essência de rosas florescendo capturada em um frasco. Graciosa, atemporal e assombrosamente bela.',
    stock: 5,
    notes: {
      top: 'Rosa Damascena, Lichia',
      heart: 'Mel, Cedro',
      base: 'Almíscar, Âmbar'
    }
  },
  {
    id: '4',
    name: 'Paleta de Sombras Elite',
    price: 65000.00,
    rating: 5,
    reviewsCount: 21,
    category: 'Maquiagem',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cv1kdsCdUlbO1P3MzpBMWtmUvt0GGIkZCGDgSYLP4Y36qLaHV5wR2M4FigH2B9e7PQP9QwNLShrv-1A7w1ihpJFuBPnNntT6tvXWt2LxQV-Vs2xvFKEuhM2mz7ruJDLpLnw-X4O8HejRQryIs-f2x4RZzqajGQkckbSL3rbwyCOz3Q4r1h2Plo5nehriZP74Swil4ww_CGz58wzxHOPw0PT5VM9P4tn5Y_iQbHxT4oa79stq13xBZuV40rdemyiokvgsWqawzxg',
    description: 'Tons curados de minerais altamente pigmentados para a melhor definição e arte dos olhos.',
    stock: 102,
  },
  {
    id: '5',
    name: 'Âmbar da Meia-Noite',
    price: 195000.00,
    rating: 4.5,
    reviewsCount: 32,
    category: 'Fragrâncias',
    image: 'https://picsum.photos/seed/amber/600/600',
    description: 'Quente e sedutor, o Âmbar da Meia-Noite é o companheiro perfeito para ocasiões noturnas.',
    stock: 12,
  },
  {
    id: '6',
    name: 'Brisa Cítrica',
    price: 175000.00,
    rating: 4.2,
    reviewsCount: 54,
    category: 'Fragrâncias',
    image: 'https://picsum.photos/seed/citrus/600/600',
    description: 'Uma explosão refrescante de frutas cítricas do Mediterrâneo e brisa marinha salgada.',
    stock: 28,
  }
];

export const MOCK_ORDERS: Order[] = [
  { id: '#BE-90210', customer: 'Julianna Smith', amount: 342100.00, status: 'PAGO', date: '10/05/2024' },
  { id: '#BE-90211', customer: 'Marcus Brown', amount: 1205500.00, status: 'ENVIADO', date: '11/05/2024' },
  { id: '#BE-90212', customer: 'Elena Gilbert', amount: 89000.00, status: 'PENDENTE', date: '12/05/2024' },
];

export const INVENTORY_ALERTS: InventoryAlert[] = [
  { name: 'Óleo de Fragrância: Gold Mist', units: 5, status: 'CRÍTICO' },
  { name: 'Frascos de Vidro (100ml)', units: 22, status: 'BAIXO' },
];
