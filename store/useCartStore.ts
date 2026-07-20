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
  setQuantity: (cartItemId: string, quantity: number) => void
  increment: (cartItemId: string) => void
  decrement: (cartItemId: string) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

/** Batas atas yang masuk akal untuk satu baris nota di toko ritel. */
const MAX_QTY = 9999

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

  setQuantity: (cartItemId, quantity) => {
    // Qty 0 atau kurang berarti item dikeluarkan dari keranjang — perilaku
    // yang diharapkan kasir saat menekan tombol kurang sampai habis.
    if (quantity <= 0) {
      set((state) => ({
        items: state.items.filter(item => item.cartItemId !== cartItemId)
      }))
      return
    }

    const clamped = Math.min(Math.floor(quantity), MAX_QTY)
    set((state) => ({
      items: state.items.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: clamped } : item
      )
    }))
  },

  increment: (cartItemId) => {
    const item = get().items.find(i => i.cartItemId === cartItemId)
    if (item) get().setQuantity(cartItemId, item.quantity + 1)
  },

  decrement: (cartItemId) => {
    const item = get().items.find(i => i.cartItemId === cartItemId)
    if (item) get().setQuantity(cartItemId, item.quantity - 1)
  },

  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0)
}))