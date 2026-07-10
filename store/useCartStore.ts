import { create } from 'zustand'

export interface Product {
  id: string
  name: string
  price: number
  type: 'retail' | 'service'
}

export interface CartItem extends Product {
  cartItemId: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: (product) => {
    set((state) => {
      // Cek apakah barang sudah ada di keranjang
      const existingItem = state.items.find(item => item.id === product.id)
      if (existingItem) {
        // Jika ada, tambah quantity-nya
        return {
          items: state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }
      // Jika belum ada, masukkan sebagai item baru
      return {
        items: [...state.items, { ...product, cartItemId: Math.random().toString(36).substring(2, 9), quantity: 1 }]
      }
    })
  },
  removeFromCart: (cartItemId) => {
    set((state) => ({
      items: state.items.filter(item => item.cartItemId !== cartItemId)
    }))
  },
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}))