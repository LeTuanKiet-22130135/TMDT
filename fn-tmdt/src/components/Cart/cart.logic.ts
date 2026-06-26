export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  storeName: string;
}

export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
