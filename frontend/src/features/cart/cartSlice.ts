import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  image?: string | null;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = "lra-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignora falha de persistência (ex.: modo privado)
  }
}

const initialState: CartState = { items: loadCart() };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const incoming = action.payload;
      const existing = state.items.find(
        (i) => i.variantId === incoming.variantId,
      );
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + incoming.quantity,
          incoming.maxStock,
        );
      } else {
        state.items.push({
          ...incoming,
          quantity: Math.min(incoming.quantity, incoming.maxStock),
        });
      }
      persist(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ variantId: number; quantity: number }>,
    ) => {
      const item = state.items.find(
        (i) => i.variantId === action.payload.variantId,
      );
      if (item) {
        item.quantity = Math.max(
          1,
          Math.min(action.payload.quantity, item.maxStock),
        );
      }
      persist(state.items);
    },
    removeItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
      persist(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
