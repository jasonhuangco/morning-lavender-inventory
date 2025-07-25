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
      app_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          setting_key: string;
          setting_value: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: string;
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

    // Test database connection
  async testConnection(): Promise<boolean> {
    if (!this.supabase) return false;
    
    try {
      // Try to fetch a simple query to test the connection
      const { data, error } = await this.supabase
        .from('locations')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, let's try to create basic tables
        console.log('Database tables do not exist. You may need to run the setup SQL in your Supabase dashboard.');
        return false;
      }
      
      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Ensure app_settings table exists and create it if it doesn't
  async ensureAppSettingsTable(): Promise<boolean> {
    if (!this.supabase) return false;
    
    try {
      // Test if app_settings table exists by trying to select from it
      const { error } = await this.supabase
        .from('app_settings')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist - user needs to create it manually
        console.warn('app_settings table does not exist. Please create it in your Supabase dashboard with this SQL:');
        console.warn(`
CREATE TABLE app_settings (
  id text PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE
ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking app_settings table:', error);
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

  async deleteCategory(categoryId: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    try {
      // First, get all products that reference this category
      const { data: products, error: productsError } = await this.supabase
        .from('products')
        .select('*')
        .contains('categories', [categoryId]);

      if (productsError) {
        console.error('Error fetching products with category:', productsError);
        throw productsError;
      }

      // Update each product to remove the category reference
      if (products && products.length > 0) {
        const updatePromises = products.map(product => {
          const updatedCategories = product.categories.filter((catId: string) => catId !== categoryId);
          return this.supabase!
            .from('products')
            .update({ categories: updatedCategories })
            .eq('id', product.id);
        });

        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults.filter(result => result.error);
        
        if (updateErrors.length > 0) {
          console.error('Error updating products:', updateErrors);
          throw new Error(`Failed to update ${updateErrors.length} products`);
        }

        console.log(`Updated ${products.length} products to remove category reference`);
      }

      // Now delete the category
      const { error: deleteError } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) {
        console.error('Error deleting category:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted category ${categoryId}`);
      return true;

    } catch (error) {
      console.error('Category deletion failed:', error);
      return false;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    try {
      // First, remove the product from any inventory sessions
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('sessions')
        .select('*');

      if (sessionsError) {
        console.error('Error fetching sessions for product cleanup:', sessionsError);
        // Continue with deletion even if we can't clean up sessions
      }

      if (sessions && sessions.length > 0) {
        const updatePromises = sessions
          .filter(session => {
            const items = session.items || [];
            return items.some((item: any) => item.productId === productId);
          })
          .map(session => {
            const updatedItems = session.items.filter((item: any) => item.productId !== productId);
            return this.supabase!
              .from('sessions')
              .update({ items: updatedItems })
              .eq('id', session.id);
          });

        if (updatePromises.length > 0) {
          const updateResults = await Promise.all(updatePromises);
          const updateErrors = updateResults.filter(result => result.error);
          
          if (updateErrors.length > 0) {
            console.error('Error updating sessions:', updateErrors);
            // Continue with deletion even if session cleanup partially fails
          } else {
            console.log(`Updated ${updatePromises.length} sessions to remove product reference`);
          }
        }
      }

      // Delete from order history
      await this.supabase
        .from('order_history')
        .delete()
        .eq('product_id', productId);

      // Now delete the product
      const { error: deleteError } = await this.supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) {
        console.error('Error deleting product:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted product ${productId}`);
      return true;

    } catch (error) {
      console.error('Product deletion failed:', error);
      return false;
    }
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

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    // First delete related order history items
    await this.supabase
      .from('order_history')
      .delete()
      .eq('session_id', sessionId);

    // Then delete the session
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

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

  // App Settings Management
  async getAppSettings(): Promise<Record<string, string>> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    // Ensure table exists
    const tableExists = await this.ensureAppSettingsTable();
    if (!tableExists) {
      console.warn('app_settings table does not exist, returning empty settings');
      return {};
    }

    const { data, error } = await this.supabase
      .from('app_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error fetching app settings:', error);
      return {};
    }

    // Convert array to key-value object
    const settings: Record<string, string> = {};
    data?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    return settings;
  }

  async upsertAppSetting(key: string, value: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    // Ensure table exists
    const tableExists = await this.ensureAppSettingsTable();
    if (!tableExists) {
      console.warn('app_settings table does not exist, cannot save setting');
      return false;
    }

    const { error } = await this.supabase
      .from('app_settings')
      .upsert({
        id: key, // Use key as ID for simplicity
        setting_key: key,
        setting_value: value,
      });

    if (error) {
      console.error('Error upserting app setting:', error);
      return false;
    }

    return true;
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase not initialized');

    // Ensure table exists
    const tableExists = await this.ensureAppSettingsTable();
    if (!tableExists) {
      console.warn('app_settings table does not exist, cannot delete setting');
      return false;
    }

    const { error } = await this.supabase
      .from('app_settings')
      .delete()
      .eq('setting_key', key);

    if (error) {
      console.error('Error deleting app setting:', error);
      return false;
    }

    return true;
  }
}
