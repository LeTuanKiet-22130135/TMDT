import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem } from '../components/Cart/cart.logic';

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  updateQuantity: (productId: number, delta: number) => void;
  removeItem: (productId: number) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const MOCK_ITEMS: CartItem[] = [
  {
    id: 1,
    productId: 101,
    name: 'Vòng tay bạc handmade',
    price: 185000,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=80&h=80&fit=crop',
    storeName: 'Silver Craft Studio',
  },
  {
    id: 2,
    productId: 102,
    name: 'Tranh sơn dầu phong cảnh',
    price: 750000,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=80&h=80&fit=crop',
    storeName: 'Art House VN',
  },
  {
    id: 3,
    productId: 103,
    name: 'Nến thơm hoa hồng',
    price: 95000,
    quantity: 3,
    image: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=80&h=80&fit=crop',
    storeName: 'Bloom & Scent',
  },
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(MOCK_ITEMS);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, openCart, closeCart, toggleCart, updateQuantity, removeItem, totalItems, totalPrice }}
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
