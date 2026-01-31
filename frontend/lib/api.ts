import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/login", credentials),
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Products APIs
export const productsAPI = {
  list: (params?: any) => api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  myProducts: () => api.get("/seller/products"),
};

// Orders APIs
export const ordersAPI = {
  create: (data: any) => api.post("/orders", data),
  get: (id: string) => api.get(`/orders/${id}`),
  myOrders: () => api.get("/buyer/orders"),
  mySales: () => api.get("/seller/orders"),
  complete: (id: string) => api.post(`/orders/${id}/complete`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

// KYC APIs
export const kycAPI = {
  submit: (data: any) => api.post("/kyc/submissions", data),
  getMine: () => api.get("/kyc/submissions/me"),
};

// Payments APIs
export const paymentsAPI = {
  createIntent: (data: any) => api.post("/payments/create-intent", data),
  generateBoleto: (data: any) => api.post("/payments/boleto", data),
};

// Withdrawals APIs
export const withdrawalsAPI = {
  request: (data: any) => api.post("/seller/withdrawals/request", data),
  list: () => api.get("/seller/withdrawals"),
  getBalance: () => api.get("/seller/balance"),
};

// Reviews APIs
export const reviewsAPI = {
  create: (data: any) => api.post("/reviews", data),
  getUserReviews: (userId: string) => api.get(`/users/${userId}/reviews`),
  getUserRating: (userId: string) => api.get(`/users/${userId}/rating`),
};

// Admin APIs
export const adminAPI = {
  // KYC
  kycList: () => api.get("/admin/kyc/submissions"),
  kycApprove: (id: string) => api.post(`/admin/kyc/submissions/${id}/approve`),
  kycReject: (id: string, reason: string) =>
    api.post(`/admin/kyc/submissions/${id}/reject`, { reason }),

  // Products
  productsPending: () => api.get("/admin/products/pending"),
  productApprove: (id: string) => api.post(`/admin/products/${id}/approve`),
  productReject: (id: string, reason: string) =>
    api.post(`/admin/products/${id}/reject`, { reason }),

  // Dashboard
  stats: () => api.get("/admin/dashboard/stats"),
  kycMetrics: () => api.get("/admin/dashboard/kyc-metrics"),
  recentActivity: () => api.get("/admin/dashboard/recent-activity"),
};
