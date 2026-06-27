// Các kiểu dữ liệu trả về từ API (Cần điều chỉnh tuỳ theo Schema chi tiết của backend)

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserRead {
  id: number;
  email: string;
  full_name?: string;
  role: string;
}

export interface ProductRead {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  store_id: number;
}

export interface CartItemRead {
  id: number;
  product_id: number;
  quantity: number;
  product?: ProductRead;
}

export interface CartRead {
  id: number;
  user_id: number;
  items: CartItemRead[];
}

export interface OrderRead {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
}

export interface StoreRead {
  id: number;
  owner_id: number;
  name: string;
  description?: string;
}

export interface ReviewRead {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
}

export interface CommentRead {
  id: number;
  user_id: number;
  product_id: number;
  content: string;
  parent_id?: number;
}

// Dành cho Admin
export interface UserAdminRead extends UserRead {
  is_active: boolean;
  is_blocked: boolean;
}

export interface StoreAdminRead extends StoreRead {
  is_active: boolean;
}

export interface ReportAdminRead {
  id: number;
  reporter_id: number;
  target_id: number;
  target_type: string;
  reason: string;
  status: string;
}
