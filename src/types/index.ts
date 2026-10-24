/**
 * A.A. Master Nig. Limited — Cement Ordering and Inventory Management System
 * Authoritative Business Rules:
 * - Brand: Sokoto Cement (Kalambaina Plant)
 * - Fixed Price: ₦10,850 per bag
 * - Bags per truck: exactly 600 bags
 * - 1 Truck = ₦6,510,000 | 2 Trucks = ₦13,020,000 | 3 Trucks = ₦19,530,000 | 5 Trucks = ₦32,550,000
 * - Orders: whole multiples of 600 bags (1 or more full trucks)
 * - Payment: 100% upfront; no part payment; credit sales prohibited
 * - Approval: Manager only
 * - Issuance: Agent only (600 bags per truck allocation)
 */

export type UserRole =
  | 'CUSTOMER'          // Customer Facing Portal / Wholesale Buyer
  | 'MANAGER'           // Manager (overall operational authority, order approvals, inventory oversight, payment verification)
  | 'ASSISTANT_MANAGER' // Assistant Manager (queue review, document verification, stock intake review)
  | 'AGENT'             // Agent (issues stock at the production site / Kalambaina Plant)
  | 'ADMIN'
  // Legacy aliases maintained for backward compatibility
  | 'STORE_MANAGER'
  | 'SALES_OFFICER'
  | 'DELIVERY_OFFICER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  officeAddress?: string;
  homeAddress?: string;
  address?: string;
  city?: string;
  state?: string;
}

export type CementBrand = 'Sokoto Cement';

export type CementGrade = '32.5R' | '42.5R' | '42.5N';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: CementBrand;
  grade: CementGrade;
  bagWeightKg: number; // 50kg standard
  bagsPerTrailer: number; // Fixed at 600 bags per truck
  tonnesPerTrailer: number; // 30 tonnes per truck
  pricePerBag: number; // Fixed at ₦10,850 per bag
  pricePerTrailer: number; // Fixed at ₦6,510,000 per truck (600 × ₦10,850)
  pricePerBagEquivalent: number; // ₦10,850
  costPerBagBasis: number; // e.g. ₦9,500 cost basis for inventory valuation
  costPerTrailerBasis: number; // e.g. ₦5,700,000
  // Authoritative physical stock tracking in bags & truck equivalents
  physicalStockBags: number; // Physical stock on hand in warehouse/plant
  reservedStockBags: number; // Stock reserved for approved/active orders
  stockOnHoldBags: number; // Quarantined or audit hold
  availableStockBags: number; // physicalStockBags - reservedStockBags - stockOnHoldBags
  // Convenience truck counters
  availableTrailers: number; // availableStockBags / 600
  reservedTrailers: number; // reservedStockBags / 600
  reorderLevelTrailers: number; // Minimum truck threshold
  minOrderTrailers: number; // Minimum 1 full truck (600 bags)
  maxOrderTrailers?: number;
  description: string;
  applications: string[];
  features: string[];
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderFulfillmentType = 'FACTORY_TRAILER_HAULAGE' | 'FACTORY_GATE_COLLECTION';

export type OrderStatus =
  | 'PENDING_APPROVAL'          // Buyer submitted order; awaiting Manager approval
  | 'REJECTED_BY_MANAGER'       // Manager rejected order
  | 'APPROVED_AWAITING_PAYMENT' // Manager approved; awaiting 100% full payment
  | 'PENDING_PAYMENT'           // Legacy alias for awaiting payment
  | 'PAYMENT_UNDER_VERIFICATION'// Buyer submitted proof of 100% payment
  | 'PAID'                      // 100% full payment verified; ready for Agent issuance
  | 'CONFIRMED'                 // Legacy alias
  | 'PROCESSING'                // Legacy alias
  | 'PARTIALLY_ISSUED'          // Some trucks issued by Agent (for multi-truck orders)
  | 'FULLY_ISSUED'              // All trucks issued by Agent
  | 'READY_FOR_COLLECTION'      // Gate pass ready for plant collection
  | 'DISPATCHED'                // Trucks on transit to buyer site
  | 'DELIVERED'                 // Offloaded at site
  | 'COMPLETED'                 // Completed order
  | 'CANCELLED'                 // Cancelled and reservation released
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentMethod =
  | 'PAYSTACK_CARD'
  | 'BANK_TRANSFER'
  | 'CASH_AT_STORE'
  | 'POS_TERMINAL';

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  brand: CementBrand;
  sku: string;
  trailerCount: number; // Number of trucks ordered (whole integer ≥ 1)
  bagsPerTrailer: number; // exactly 600
  totalBags: number; // trailerCount * 600
  totalTonnes: number; // trailerCount * 30
  unitPricePerTrailer: number; // Fixed at ₦6,510,000
  subtotal: number;
}

export interface TrailerDeliveryDetails {
  recipientName: string;
  recipientPhone: string;
  siteAddress: string;
  landmark?: string;
  city: string;
  state: string;
  deliveryZone: string;
  haulageFeePerTrailer: number;
  totalHaulageFee: number;
  offloadingFeePerTrailer: number;
  totalOffloadingFee: number;
  deliveryOfficerId?: string;
  deliveryOfficerName?: string;
  truckTractorHeadReg?: string; // e.g. SKK-782-XA
  trailerBedReg?: string; // e.g. T-904-SOK
  driverPhone?: string;
  dispatchTimestamp?: string;
  deliveredTimestamp?: string;
  proofOfDeliveryNotes?: string;
  recipientSignatureName?: string;
}

export interface FactoryCollectionDetails {
  plantDepotLocation: string; // e.g. Kalambaina Plant, Sokoto
  collectionPassCode: string;
  transporterName: string;
  transporterPhone: string;
  truckHeadReg: string;
  trailerBedReg: string;
  driverName: string;
  driverLicenseNo?: string;
  gatePassIssuedTimestamp?: string;
  collectedTimestamp?: string;
  confirmedByStaffId?: string;
  confirmedByStaffName?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  updatedByUserId: string;
  updatedByName: string;
  role: UserRole;
  notes?: string;
}

export interface TruckIssuanceAllocation {
  id: string;
  truckIndex: number; // 1, 2, ... totalTrailers
  truckLabel: string; // e.g. "Truck 1 of 3"
  bagsCount: number; // Fixed at 600 bags
  tonnes: number; // 30 tonnes
  status: 'PENDING_ISSUANCE' | 'ISSUED';
  issuedAt?: string;
  issuedByAgentId?: string;
  issuedByAgentName?: string;
  truckHeadReg?: string;
  trailerBedReg?: string;
  driverName?: string;
  driverPhone?: string;
  recipientSignatureName?: string;
  waybillPassCode?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. AAM-202610-8492
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  items: OrderItem[];
  totalTrailers: number; // Whole number of trucks
  totalBags: number; // totalTrailers * 600
  totalTonnes: number; // totalTrailers * 30
  subtotal: number; // totalTrailers * ₦6,510,000
  haulageFee: number;
  offloadingFee: number;
  totalAmount: number; // 100% full payment required
  fulfillmentType: OrderFulfillmentType;
  deliveryDetails?: TrailerDeliveryDetails;
  collectionDetails?: FactoryCollectionDetails;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  statusHistory: OrderStatusHistoryItem[];
  // Manager Approval Control (Section 1 & 5)
  managerApprovalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  approvedByManagerId?: string;
  approvedByManagerName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  // Truck allocations for Agent physical issuance (Section 6)
  truckAllocations: TruckIssuanceAllocation[];
  issuedTrucksCount: number; // Number of trucks physically issued by Agent
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  isFullPayment: boolean; // Must be 100% of order total
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  gatewayReference?: string;
  bankTransferReference?: string;
  bankPayerName?: string;
  destinationAccount?: string;
  posTerminalId?: string;
  verifiedByStaffId?: string;
  verifiedByStaffName?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type StockReceiptStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVERSED';

export interface StockReceipt {
  id: string;
  receiptReference: string; // e.g. AAM-SR-202610-0001
  supplierName: string;
  supplierReference?: string;
  cementBrand: CementBrand;
  productId: string;
  productName: string;
  receiptDateTime: string;
  trucksReceived: number; // Integer ≥ 1
  bagsPerTruck: number; // Fixed at 600 bags
  totalBagsReceived: number; // trucksReceived * 600
  supplierDeliveryNote: string;
  vehicleReg: string; // e.g. SKK-782-XA / T-904-SOK
  driverName?: string;
  driverPhone?: string;
  receivingStaffId: string;
  receivingStaffName: string;
  receivingStaffRole: UserRole;
  notesOrDiscrepancies?: string;
  status: StockReceiptStatus;
  verifierId?: string;
  verifierName?: string;
  verifierRole?: UserRole;
  verifiedAt?: string;
  verificationNotes?: string;
  linkedMovementId?: string;
  reversalReason?: string;
  reversedAt?: string;
  reversedById?: string;
  reversedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningStockEntry {
  id: string;
  countReference: string; // e.g. AAM-OP-001
  physicalCountDate: string;
  productId: string;
  productName: string;
  trucksCounted: number;
  totalConfirmedBags: number; // trucksCounted * 600
  countingStaffId: string;
  countingStaffName: string;
  verifierId: string;
  verifierName: string;
  approvedByManagerId: string;
  approvedByManagerName: string;
  status: 'APPROVED';
  notes: string;
  linkedMovementId: string;
  createdAt: string;
}

export type LedgerMovementType =
  | 'APPROVED_SUPPLIER_STOCK_RECEIPT'
  | 'APPROVED_OPENING_STOCK'
  | 'STOCK_RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'CEMENT_ISSUANCE'
  | 'AUTHORISED_RETURN_TO_STOCK'
  | 'DAMAGED_OR_LOST_STOCK'
  | 'APPROVED_STOCK_ADJUSTMENT'
  | 'REVERSAL_OF_INCORRECT_MOVEMENT';

export interface StockMovement {
  id: string;
  movementReference: string; // e.g. AAM-MV-202610-0012
  productId: string;
  productName: string;
  sku: string;
  movementType: LedgerMovementType;
  quantityBags: number; // Positive for addition, negative for deduction
  quantityTrucks: number; // quantityBags / 600
  sourceDocumentReference: string; // e.g. Receipt Reference, Order Number, Opening Count
  previousPhysicalBags: number;
  previousAvailableBags: number;
  previousReservedBags: number;
  resultingPhysicalBags: number;
  resultingAvailableBags: number;
  resultingReservedBags: number;
  userResponsibleId: string;
  userResponsibleName: string;
  userRole: UserRole;
  approvingUserId?: string;
  approvingUserName?: string;
  approvingUserRole?: UserRole;
  reason: string;
  timestamp: string;
  // Legacy aliases
  trailerChange?: number;
  resultingTrailers?: number;
  authorizedByName?: string;
  type?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'ORDER' | 'PRODUCT' | 'INVENTORY' | 'STOCK_RECEIPT' | 'PAYMENT' | 'DELIVERY' | 'USER' | 'SETTINGS';
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface BusinessSettings {
  storeName: string; // A.A. Master Nig. Limited
  tagline: string;
  rcNumber: string;
  tinNumber: string;
  supportPhone: string;
  supportEmail: string;
  plantAddress: string;
  depots: {
    id: string;
    name: string;
    address: string;
    contactPhone: string;
    managerName: string;
  }[];
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
  };
  interstateHaulageZones: {
    id: string;
    name: string;
    haulageFeePerTrailer: number;
    estimatedDeliveryDays: string;
  }[];
  offloadingFeePerTrailer: number;
  fixedPricePerBag: number; // ₦10,850
  fixedPricePerTruck: number; // ₦6,510,000
  bagsPerTrailer: number; // 600
  minOrderTrailers: number; // 1
  isOpeningStockRecorded: boolean; // Enforce opening stock entered once per inventory baseline
  updatedAt?: string;
}

export interface AcceptanceTestResult {
  testId: number;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  timestamp: string;
}
