import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Location, Category, Supplier, InventorySession, OrderHistoryItem } from '../types';

interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          address: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          color: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          categories: string[];
          suppliers: string[];
          requires_quantity: boolean;
          locations: any[]; // Array of ProductLocation objects
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          categories: string[];
          suppliers: string[];
          requires_quantity: boolean;
          locations: any[]; // Array of ProductLocation objects
        };
        Update: {
          id?: string;
          name?: string;
          categories?: string[];
          suppliers?: string[];
          requires_quantity?: boolean;
          locations?: any[]; // Array of ProductLocation objects
        };
      };
      sessions: {
        Row: {
          id: string;
          location_id: string;
          user_name: string;
          start_date: string;
          end_date: string | null;
          items: any[];
          is_submitted: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          location_id: string;
          user_name: string;
          start_date: string;
          end_date?: string | null;
          items: any[];
          is_submitted: boolean;
        };
        Update: {
          id?: string;
          location_id?: string;
          user_name?: string;
          start_date?: string;
          end_date?: string | null;
          items?: any[];
          is_submitted?: boolean;
        };
      };
      order_history: {
        Row: {
          id: string;
          session_id: string;
          product_id: string;
          location_id: string;
          order_date: string;
          quantity_ordered: number | null;
          suppliers: string[] | null;
          category_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          product_id: string;
          location_id: string;
          order_date: string;
          quantity_ordered?: number | null;
          suppliers?: string[] | null;
          category_ids?: string[] | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          product_id?: string;
          location_id?: string;
          order_date?: string;
          quantity_ordered?: number | null;
          suppliers?: string[] | null;
          category_ids?: string[] | null;
        };
      };
    };
  };
}

export class SupabaseService {
  private supabase: SupabaseClient<Database> | null = null;

  constructor() {}

  initialize(supabaseUrl: string, supabaseKey: string): boolean {
    try {
      this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.supabase !== null;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await this.supabase.from('locations').select('count').limit(1);
      
      if (error) {
        console.error('Supabase connection test error:', error);
        return false;
      }
      
      console.log('Supabase connection test successful, data:', data);
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    console.log('Fetching locations from Supabase...');
    const { data, error } = await this.supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    console.log('Locations fetched:', data?.length || 0);
    return data.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
    }));
  }

  async addLocation(location: Location): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('locations')
      .insert({
        id: location.id,
        name: location.name,
        address: location.address,
      });

    return !error;
  }

  async upsertLocation(location: Location): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('locations')
      .upsert({
        id: location.id,
        name: location.name,
        address: location.address,
      });

    return !error;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }));
  }

  async addCategory(category: Category): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('categories')
      .insert({
        id: category.id,
        name: category.name,
        color: category.color || '#E3F2FD',
      });

    return !error;
  }

  async upsertCategory(category: Category): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('categories')
      .upsert({
        id: category.id,
        name: category.name,
        color: category.color || '#E3F2FD',
      });

    return !error;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      name: row.name,
    }));
  }

  async addSupplier(supplier: Supplier): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('suppliers')
      .insert({
        id: supplier.id,
        name: supplier.name,
      });

    return !error;
  }

  async upsertSupplier(supplier: Supplier): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('suppliers')
      .upsert({
        id: supplier.id,
        name: supplier.name,
      });

    return !error;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      name: row.name,
      categories: row.categories,
      suppliers: row.suppliers,
      requiresQuantity: row.requires_quantity,
      locations: row.locations,
    }));
  }

  async addProduct(product: Product): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('products')
      .insert({
        id: product.id,
        name: product.name,
        categories: product.categories,
        suppliers: product.suppliers,
        requires_quantity: product.requiresQuantity,
        locations: product.locations,
      });

    return !error;
  }

  async upsertProduct(product: Product): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('products')
      .upsert({
        id: product.id,
        name: product.name,
        categories: product.categories,
        suppliers: product.suppliers,
        requires_quantity: product.requiresQuantity,
        locations: product.locations,
      });

    return !error;
  }

  // Sessions
  async getSessions(): Promise<InventorySession[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      locationId: row.location_id,
      userName: row.user_name,
      startDate: row.start_date,
      endDate: row.end_date || '',
      items: row.items,
      isSubmitted: row.is_submitted,
    }));
  }

  async addSession(session: InventorySession): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('sessions')
      .insert({
        id: session.id,
        location_id: session.locationId,
        user_name: session.userName,
        start_date: session.startDate,
        end_date: session.endDate || null,
        items: session.items,
        is_submitted: session.isSubmitted,
      });

    return !error;
  }

  async updateSession(session: InventorySession): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('sessions')
      .update({
        location_id: session.locationId,
        user_name: session.userName,
        start_date: session.startDate,
        end_date: session.endDate || null,
        items: session.items,
        is_submitted: session.isSubmitted,
      })
      .eq('id', session.id);

    return !error;
  }

  async upsertSession(session: InventorySession): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('sessions')
      .upsert({
        id: session.id,
        location_id: session.locationId,
        user_name: session.userName,
        start_date: session.startDate,
        end_date: session.endDate || null,
        items: session.items,
        is_submitted: session.isSubmitted,
      });

    return !error;
  }

  // Order History
  async getOrderHistory(): Promise<OrderHistoryItem[]> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { data, error } = await this.supabase
      .from('order_history')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      productId: row.product_id,
      locationId: row.location_id,
      orderDate: row.order_date,
      quantityOrdered: row.quantity_ordered,
      sessionId: row.session_id,
      suppliers: row.suppliers || [],
      categoryIds: row.category_ids || [],
    }));
  }

  async addOrderHistoryItems(items: OrderHistoryItem[]): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    const { error } = await this.supabase
      .from('order_history')
      .insert(
        items.map(item => ({
          id: `${item.sessionId}-${item.productId}-${Date.now()}`, // Generate unique ID
          session_id: item.sessionId,
          product_id: item.productId,
          location_id: item.locationId,
          order_date: item.orderDate,
          quantity_ordered: item.quantityOrdered,
          suppliers: item.suppliers,
          category_ids: item.categoryIds,
        }))
      );

    return !error;
  }

  // Sync all data from Supabase
  async syncFromDatabase(): Promise<{
    locations: Location[];
    categories: Category[];
    suppliers: Supplier[];
    products: Product[];
    sessions: InventorySession[];
    orderHistory: OrderHistoryItem[];
  }> {
    console.log('SupabaseService: Starting syncFromDatabase...');
    
    const [locations, categories, suppliers, products, sessions, orderHistory] = await Promise.all([
      this.getLocations(),
      this.getCategories(),
      this.getSuppliers(),
      this.getProducts(),
      this.getSessions(),
      this.getOrderHistory(),
    ]);

    console.log('SupabaseService: Sync results:', {
      locations: locations.length,
      categories: categories.length,
      suppliers: suppliers.length,
      products: products.length,
      sessions: sessions.length,
      orderHistory: orderHistory.length
    });

    return {
      locations,
      categories,
      suppliers,
      products,
      sessions,
      orderHistory,
    };
  }
}
