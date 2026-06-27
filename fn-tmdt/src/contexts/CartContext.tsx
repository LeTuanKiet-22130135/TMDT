import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CartItem } from '../components/Cart/cart.logic';
import { cartDBGetAll, cartDBPut, cartDBDelete, cartDBClear } from '../services/cartDB';

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  addedProductId: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cartDBGetAll().then(setItems).catch(() => {});
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.productId === item.productId)) return prev;
      const next = [...prev, item];
      cartDBPut(item).catch(() => {});
      return next;
    });

    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAddedProductId(item.productId);
    addedTimerRef.current = setTimeout(() => setAddedProductId(null), 800);

    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    cartDBDelete(productId).catch(() => {});
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    cartDBClear().catch(() => {});
  }, []);

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        items, isOpen, openCart, closeCart, toggleCart,
        addItem, removeItem, clearCart,
        totalItems, totalPrice, addedProductId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
