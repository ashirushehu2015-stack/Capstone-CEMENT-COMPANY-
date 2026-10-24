/**
 * Sokoto Cement Direct Logistics & Distribution System
 * Client API Service
 */

import type {
  User,
  Product,
  Order,
  PaymentRecord,
  StockMovement,
  AuditLog,
  BusinessSettings,
  UserRole,
  OrderStatus,
  StockReceipt,
  OpeningStockEntry,
  AcceptanceTestResult,
  TruckIssuanceAllocation,
} from '../types/index.ts';

const TOKEN_KEY = 'sokoto_cement_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// --- Auth Endpoints ---
export const apiAuth = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    companyName?: string;
    officeAddress?: string;
    homeAddress?: string;
    address?: string;
    city?: string;
    state?: string;
  }) => {
    const res = await request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  getMe: async () => {
    return request<{ success: boolean; user: User }>('/api/auth/me');
  },

  logout: async () => {
    try {
      await request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  getStaff: async () => {
    return request<{ success: boolean; staff: User[] }>('/api/auth/staff');
  },

  createStaff: async (staffData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: UserRole;
  }) => {
    return request<{ success: boolean; staff: User; message: string }>('/api/auth/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },
};

// --- Products Endpoints ---
export const apiProducts = {
  getAll: async () => {
    return request<{ success: boolean; products: Product[] }>('/api/products');
  },

  getById: async (id: string) => {
    return request<{ success: boolean; product: Product }>(`/api/products/${id}`);
  },

  update: async (id: string, updates: Partial<Product>) => {
    return request<{ success: boolean; product: Product; message: string }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// --- Orders Endpoints ---
export const apiOrders = {
  create: async (orderPayload: {
    items: { productId: string; trailerCount: number }[];
    companyName?: string;
    fulfillmentType: 'FACTORY_TRAILER_HAULAGE' | 'FACTORY_GATE_COLLECTION';
    deliveryDetails?: {
      recipientName: string;
      recipientPhone: string;
      siteAddress: string;
      landmark?: string;
      city: string;
      state: string;
      deliveryZoneId: string;
    };
    collectionDetails?: {
      plantDepotId: string;
      transporterName: string;
      transporterPhone: string;
      truckHeadReg: string;
      trailerBedReg: string;
      driverName: string;
      driverLicenseNo?: string;
    };
    paymentMethod: 'PAYSTACK_CARD' | 'BANK_TRANSFER' | 'CASH_AT_STORE' | 'POS_TERMINAL';
    customerNotes?: string;
  }) => {
    return request<{ success: boolean; order: Order; message: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  },

  getAll: async (filters?: { status?: string; fulfillment?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.fulfillment) params.set('fulfillment', filters.fulfillment);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; orders: Order[] }>(`/api/orders${query}`);
  },

  getById: async (id: string) => {
    return request<{ success: boolean; order: Order }>(`/api/orders/${id}`);
  },

  updateStatus: async (
    id: string,
    payload: {
      status: OrderStatus;
      notes?: string;
      deliveryOfficerId?: string;
      deliveryOfficerName?: string;
      truckTractorHeadReg?: string;
      trailerBedReg?: string;
      driverPhone?: string;
      proofOfDeliveryNotes?: string;
      recipientSignatureName?: string;
    }
  ) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  cancel: async (id: string, reason?: string) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  approveByManager: async (id: string, notes?: string) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/orders/${id}/approve-manager`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  rejectByManager: async (id: string, reason: string) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/orders/${id}/reject-manager`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  recordFullPayment: async (
    id: string,
    data: {
      amount: number;
      paymentMethod: string;
      referenceNumber: string;
      payerName?: string;
      destinationAccount?: string;
      notes?: string;
    }
  ) => {
    return request<{ success: boolean; payment: PaymentRecord; order: Order; message: string }>(
      `/api/orders/${id}/record-payment`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  issueTruckByAgent: async (
    id: string,
    data: {
      truckAllocationId: string;
      truckHeadReg: string;
      trailerBedReg: string;
      driverName: string;
      driverPhone?: string;
      recipientSignatureName: string;
      notes?: string;
    }
  ) => {
    return request<{
      success: boolean;
      order: Order;
      allocation: TruckIssuanceAllocation;
      movement: StockMovement;
      message: string;
    }>(`/api/orders/${id}/issue-truck`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// --- Inventory Endpoints ---
export const apiInventory = {
  getDashboardMetrics: async () => {
    return request<{
      success: boolean;
      metrics: {
        openingStockBags: number;
        openingStockTrucks: number;
        totalStockReceivedBags: number;
        totalStockReceivedTrucks: number;
        totalStockIssuedBags: number;
        totalStockIssuedTrucks: number;
        totalPhysicalStockBags: number;
        totalPhysicalStockTrucks: number;
        totalReservedStockBags: number;
        totalReservedStockTrucks: number;
        totalAvailableStockBags: number;
        totalAvailableStockTrucks: number;
        totalStockOnHoldBags: number;
        totalStockOnHoldTrucks: number;
        totalCostValuationNGN: number;
        totalEstimatedSalesValueNGN: number;
        pendingStockReceiptsCount: number;
        rejectedReversedReceiptsCount: number;
        ordersAwaitingApprovalCount: number;
        ordersAwaitingIssuanceCount: number;
        productSummaries: any[];
      };
    }>('/api/inventory/dashboard-metrics');
  },

  getReceipts: async (filters?: { status?: string; productId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.productId) params.set('productId', filters.productId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; receipts: StockReceipt[] }>(`/api/inventory/receipts${query}`);
  },

  createReceipt: async (data: {
    supplierName: string;
    supplierReference?: string;
    productId: string;
    receiptDateTime?: string;
    trucksReceived: number;
    supplierDeliveryNote: string;
    vehicleReg: string;
    driverName?: string;
    driverPhone?: string;
    notesOrDiscrepancies?: string;
    isDraft?: boolean;
  }) => {
    return request<{ success: boolean; receipt: StockReceipt; message: string }>('/api/inventory/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveReceipt: async (id: string, verificationNotes?: string) => {
    return request<{ success: boolean; receipt: StockReceipt; movement: StockMovement; message: string }>(
      `/api/inventory/receipts/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ verificationNotes }),
      }
    );
  },

  rejectReceipt: async (id: string, reason: string) => {
    return request<{ success: boolean; receipt: StockReceipt; message: string }>(
      `/api/inventory/receipts/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  },

  reverseReceipt: async (id: string, reversalReason: string) => {
    return request<{ success: boolean; receipt: StockReceipt; movement: StockMovement; message: string }>(
      `/api/inventory/receipts/${id}/reverse`,
      {
        method: 'POST',
        body: JSON.stringify({ reversalReason }),
      }
    );
  },

  getOpeningStock: async () => {
    return request<{ success: boolean; entries: OpeningStockEntry[] }>('/api/inventory/opening-stock');
  },

  recordOpeningStock: async (data: {
    physicalCountDate?: string;
    productId: string;
    trucksCounted: number;
    countingStaffId: string;
    countingStaffName: string;
    verifierId: string;
    verifierName: string;
    notes?: string;
  }) => {
    return request<{ success: boolean; entry: OpeningStockEntry; message: string }>('/api/inventory/opening-stock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  runAcceptanceTests: async () => {
    return request<{
      success: boolean;
      summary: string;
      allPassed: boolean;
      results: AcceptanceTestResult[];
    }>('/api/inventory/acceptance-tests/run', {
      method: 'POST',
    });
  },

  getMovements: async () => {
    return request<{ success: boolean; movements: StockMovement[] }>('/api/inventory/movements');
  },

  getStockSummary: async () => {
    return request<{
      success: boolean;
      summary: {
        id: string;
        sku: string;
        name: string;
        brand: string;
        grade: string;
        pricePerTrailer: number;
        pricePerBagEquivalent: number;
        availableTrailers: number;
        reservedTrailers: number;
        totalPhysicalTrailers: number;
        totalBagsEquivalent: number;
        reorderLevelTrailers: number;
        isLowStock: boolean;
        valuationNGN: number;
      }[];
    }>('/api/inventory/stock-summary');
  },

  receiveGoods: async (data: {
    productId: string;
    trailersReceived: number;
    batchNumber: string;
    plantKilnReference: string;
    notes?: string;
  }) => {
    return request<{ success: boolean; product: Product; movement: StockMovement; message: string }>(
      '/api/inventory/receive-goods',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  adjustStock: async (data: {
    productId: string;
    trailerChange: number;
    type: 'DAMAGED_BAGS_REPACKED' | 'DEPOT_AUDIT_ADJUSTMENT';
    reason: string;
  }) => {
    return request<{ success: boolean; product: Product; movement: StockMovement; message: string }>(
      '/api/inventory/adjust',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// --- Payments Endpoints ---
export const apiPayments = {
  getAll: async () => {
    return request<{ success: boolean; payments: PaymentRecord[] }>('/api/payments');
  },

  submitTransferClaim: async (
    dataOrOrderId:
      | string
      | {
          orderId: string;
          bankTransferReference?: string;
          referenceNumber?: string;
          payerName: string;
          destinationAccount?: string;
        },
    optionalData?: {
      referenceNumber?: string;
      bankTransferReference?: string;
      payerName: string;
      destinationAccount?: string;
    }
  ) => {
    let payload: {
      orderId: string;
      bankTransferReference: string;
      payerName: string;
      destinationAccount?: string;
    };

    if (typeof dataOrOrderId === 'string') {
      payload = {
        orderId: dataOrOrderId,
        bankTransferReference: optionalData?.bankTransferReference || optionalData?.referenceNumber || '',
        payerName: optionalData?.payerName || '',
        destinationAccount: optionalData?.destinationAccount,
      };
    } else {
      payload = {
        orderId: dataOrOrderId.orderId,
        bankTransferReference: dataOrOrderId.bankTransferReference || dataOrOrderId.referenceNumber || '',
        payerName: dataOrOrderId.payerName,
        destinationAccount: dataOrOrderId.destinationAccount,
      };
    }

    return request<{ success: boolean; order: Order; message: string }>('/api/payments/submit-transfer-claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyPaystack: async (data: { orderId: string; reference: string }) => {
    return request<{ success: boolean; payment: PaymentRecord; order: Order; message: string }>(
      '/api/payments/verify-paystack',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  recordOffline: async (data: {
    orderId: string;
    paymentMethod: 'BANK_TRANSFER' | 'CASH_AT_STORE' | 'POS_TERMINAL';
    amount: number;
    referenceNumber: string;
    payerName?: string;
    destinationAccount?: string;
    notes?: string;
  }) => {
    return request<{ success: boolean; payment: PaymentRecord; message: string }>('/api/payments/record-offline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// --- Deliveries Endpoints ---
export const apiDeliveries = {
  getAll: async () => {
    return request<{ success: boolean; deliveries: Order[] }>('/api/deliveries');
  },

  assign: async (
    orderId: string,
    data: {
      deliveryOfficerId: string;
      truckTractorHeadReg: string;
      trailerBedReg: string;
      driverPhone?: string;
      notes?: string;
    }
  ) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/deliveries/${orderId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  dispatch: async (orderId: string, data: { truckTractorHeadReg?: string; trailerBedReg?: string; notes?: string }) => {
    return request<{ success: boolean; order: Order; message: string }>(`/api/deliveries/${orderId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirmDelivery: async (
    orderId: string,
    data: { recipientSignatureName: string; proofOfDeliveryNotes: string }
  ) => {
    return request<{ success: boolean; order: Order; message: string }>(
      `/api/deliveries/${orderId}/confirm-delivery`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  confirmCollection: async (
    orderId: string,
    data: { collectionPassCode: string; transporterName: string; notes?: string }
  ) => {
    return request<{ success: boolean; order: Order; message: string }>(
      `/api/deliveries/${orderId}/confirm-collection`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// --- Reports & Settings Endpoints ---
export const apiReports = {
  getAnalytics: async () => {
    return request<{
      success: boolean;
      metrics: {
        totalRevenueNGN: number;
        totalTrailersSold: number;
        totalBagsSold: number;
        totalTonnesSold: number;
        pendingOrdersCount: number;
        activeProcessingOrdersCount: number;
        dispatchedOrReadyCount: number;
        completedOrdersCount: number;
        totalTrailersInYard: number;
        totalBagsInYard: number;
        stockValuationNGN: number;
        lowStockAlertsCount: number;
        lowStockProducts: {
          id: string;
          name: string;
          brand: string;
          availableTrailers: number;
          reorderLevelTrailers: number;
        }[];
      };
      productSales: Record<string, { trailers: number; bags: number; revenueNGN: number }>;
      paymentMethodStats: Record<string, { count: number; totalNGN: number }>;
      recentOrders: Order[];
      recentPayments: PaymentRecord[];
    }>('/api/reports/analytics');
  },

  getAuditLogs: async () => {
    return request<{ success: boolean; logs: AuditLog[] }>('/api/reports/audit-logs');
  },

  getSettings: async () => {
    return request<{ success: boolean; settings: BusinessSettings }>('/api/reports/settings');
  },

  updateSettings: async (settings: Partial<BusinessSettings>) => {
    return request<{ success: boolean; settings: BusinessSettings; message: string }>('/api/reports/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
