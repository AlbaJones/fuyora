// User types
export type KYCStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  kyc_status: KYCStatus;
  kyc_rejection_reason?: string;
  is_banned: boolean;
  ban_reason?: string;
  ban_type?: 'TEMPORARY' | 'PERMANENT';
  ban_expires_at?: string;
  created_at: string;
  
  // Computed property: can sell if KYC is approved
  get can_sell(): boolean;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Registration data
export interface RegisterData {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Product types
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'INACTIVE';
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  digital_product: boolean;
  file_url?: string;
  created_at: string;
}

// Order types
export type OrderStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  amount: number;
  status: OrderStatus;
  payment_id?: string;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
}
