import { createContext, ReactNode, useCallback, useContext, useState } from "react";

import { api } from "../api/client";
import type { Cart } from "../types";

interface CartContextValue {
  cart: Cart | null;
  refreshCart: () => Promise<void>;
  addItem: (listingId: number, quantity?: number) => Promise<void>;
  addComboItem: (comboListingId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  const refreshCart = useCallback(async () => {
    const { data } = await api.get<Cart>("/cart/");
    setCart(data);
  }, []);

  async function addItem(listingId: number, quantity = 1) {
    const { data } = await api.post<Cart>("/cart/items/", {
      listing_id: listingId,
      quantity,
    });
    setCart(data);
  }

  async function addComboItem(comboListingId: number, quantity = 1) {
    const { data } = await api.post<Cart>("/cart/items/", {
      combo_listing_id: comboListingId,
      quantity,
    });
    setCart(data);
  }

  async function updateItem(itemId: number, quantity: number) {
    const { data } = await api.patch<Cart>(`/cart/items/${itemId}/`, { quantity });
    setCart(data);
  }

  async function removeItem(itemId: number) {
    const { data } = await api.delete<Cart>(`/cart/items/${itemId}/`);
    setCart(data);
  }

  return (
    <CartContext.Provider
      value={{ cart, refreshCart, addItem, addComboItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
