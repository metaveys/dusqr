import type { Product } from '../types'

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Trüflü Burger',
    price: 320,
    description: 'Brioche ekmek, cheddar, trüf mayo, karamelize soğan.',
    category: 'Burger',
    image_url:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'p2',
    name: 'Çıtır Tavuk Burger',
    price: 260,
    description: 'Baharatlı çıtır tavuk, coleslaw, özel sos.',
    category: 'Burger',
    image_url:
      'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'p3',
    name: 'Margherita Pizza',
    price: 290,
    description: 'Mozzarella, fesleğen, domates sos.',
    category: 'Pizza',
    image_url:
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'p4',
    name: 'Fırın Lazanya',
    price: 310,
    description: 'Bol sos, parmesan dokunuşu.',
    category: 'Makarna',
    image_url:
      'https://images.unsplash.com/photo-1604908554162-45f0c9d7e2a3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'p5',
    name: 'Tiramisu',
    price: 190,
    description: 'Espresso, mascarpone, kakao.',
    category: 'Tatlı',
    image_url:
      'https://images.unsplash.com/photo-1618426703623-c1b335803b19?auto=format&fit=crop&w=1200&q=80',
  },
]

