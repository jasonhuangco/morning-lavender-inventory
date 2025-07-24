export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categories: string[]; // Array of category IDs
  suppliers: string[]; // Array of supplier IDs
  locations: ProductLocation[]; // Location-specific data
  requiresQuantity: boolean; // true for quantity-based, false for checkbox-only
}

export interface ProductLocation {
  locationId: string;
  minThreshold?: number; // Only for quantity-based products
  isAvailable: boolean;
}

export interface InventoryItem {
  productId: string;
  locationId: string;
  currentQuantity?: number; // Only for quantity-based products
  shouldOrder: boolean;
  lastOrderDate?: string;
}

export interface InventorySession {
  id: string;
  locationId: string;
  userName: string;
  startDate: string;
  endDate?: string;
  items: InventoryItem[];
  isSubmitted: boolean;
}

export interface OrderSummary {
  sessionId: string;
  locationName: string;
  userName: string;
  orderDate: string;
  items: {
    productName: string;
    quantity?: number;
    suppliers: string[]; // Changed from supplier to suppliers array
  }[];
}

export interface OrderHistoryItem {
  productId: string;
  locationId: string;
  orderDate: string;
  quantityOrdered?: number;
  sessionId: string;
  suppliers: string[]; // Add supplier information
  categoryIds: string[]; // Add category information for filtering
}

export interface AppState {
  locations: Location[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  sessions: InventorySession[];
  orderHistory: OrderHistoryItem[];
  currentSession?: InventorySession;
}
