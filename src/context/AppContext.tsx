import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Location, Category, Supplier, Product, InventorySession, OrderHistoryItem } from '../types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isLoading: boolean;
  error: string | null;
  getLastOrderInfo: (productId: string, locationId: string) => { date: string; quantity?: number } | null;
  syncWithSupabase: (forcePullFirst?: boolean) => Promise<void>;
  pullFromDatabase: () => Promise<void>;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  isInitialized: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_SESSIONS'; payload: InventorySession[] }
  | { type: 'SET_ORDER_HISTORY'; payload: OrderHistoryItem[] }
  | { type: 'SET_CURRENT_SESSION'; payload: InventorySession | undefined }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_SESSION'; payload: InventorySession }
  | { type: 'ADD_ORDER_HISTORY_ITEMS'; payload: OrderHistoryItem[] }
  | { type: 'UPDATE_LOCATION'; payload: Location }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_LOCATION'; payload: string }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'DELETE_SESSION'; payload: string };

const initialState: AppState = {
  locations: [],
  categories: [],
  suppliers: [],
  products: [],
  sessions: [],
  orderHistory: [],
  currentSession: undefined,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_SESSIONS':
      // Preserve current session if it's not in the new sessions list (e.g., during sync)
      let preservedCurrentSession = state.currentSession;
      if (state.currentSession && !action.payload.find(s => s.id === state.currentSession!.id)) {
        // Current session is not in the new list, keep it as is
        console.log('Preserving current session during SET_SESSIONS');
      } else if (state.currentSession) {
        // Update current session with synced version if it exists
        const updatedCurrentSession = action.payload.find(s => s.id === state.currentSession!.id);
        if (updatedCurrentSession) {
          preservedCurrentSession = updatedCurrentSession;
        }
      }
      return { 
        ...state, 
        sessions: action.payload,
        currentSession: preservedCurrentSession
      };
    case 'SET_ORDER_HISTORY':
      return { ...state, orderHistory: action.payload };
    case 'SET_CURRENT_SESSION':
      // When setting a new current session, also add it to sessions if it doesn't exist
      const newSession = action.payload;
      if (newSession && !state.sessions.find(s => s.id === newSession.id)) {
        const updatedSessions = [...state.sessions, newSession];
        return { 
          ...state, 
          currentSession: newSession,
          sessions: updatedSessions
        };
      }
      return { ...state, currentSession: newSession };
    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.payload] };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_SESSION':
      const updatedSessions = state.sessions.map(session =>
        session.id === action.payload.id ? action.payload : session
      );
      
      // If session doesn't exist in sessions array, add it
      if (!state.sessions.find(s => s.id === action.payload.id)) {
        updatedSessions.push(action.payload);
      }
      
      return {
        ...state,
        sessions: updatedSessions,
        currentSession: state.currentSession?.id === action.payload.id ? action.payload : state.currentSession,
      };
    case 'ADD_ORDER_HISTORY_ITEMS':
      return {
        ...state,
        orderHistory: [...state.orderHistory, ...action.payload],
      };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(location =>
          location.id === action.payload.id ? action.payload : location
        ),
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
      };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? action.payload : supplier
        ),
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        ),
      };
    case 'DELETE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(location => location.id !== action.payload),
      };
    case 'DELETE_CATEGORY':
      // Track deleted category ID with timestamp to prevent it from coming back during sync
      const deletedCategories = JSON.parse(localStorage.getItem('deleted-categories') || '[]');
      const deletedCategoriesWithTimestamp = JSON.parse(localStorage.getItem('deleted-categories-with-timestamp') || '[]');
      
      deletedCategories.push(action.payload);
      deletedCategoriesWithTimestamp.push({
        categoryId: action.payload,
        timestamp: Date.now()
      });
      
      localStorage.setItem('deleted-categories', JSON.stringify(deletedCategories));
      localStorage.setItem('deleted-categories-with-timestamp', JSON.stringify(deletedCategoriesWithTimestamp));

      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
        // Also update products to remove the deleted category reference
        products: state.products.map(product => ({
          ...product,
          categories: product.categories.filter(catId => catId !== action.payload)
        }))
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => supplier.id !== action.payload),
      };
    case 'DELETE_PRODUCT':
      // Track deleted product ID with timestamp to prevent it from coming back during sync
      const deletedProducts = JSON.parse(localStorage.getItem('deleted-products') || '[]');
      const deletedProductsWithTimestamp = JSON.parse(localStorage.getItem('deleted-products-with-timestamp') || '[]');
      
      deletedProducts.push(action.payload);
      deletedProductsWithTimestamp.push({
        productId: action.payload,
        timestamp: Date.now()
      });
      
      localStorage.setItem('deleted-products', JSON.stringify(deletedProducts));
      localStorage.setItem('deleted-products-with-timestamp', JSON.stringify(deletedProductsWithTimestamp));

      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload),
        // Also remove the product from any active sessions
        currentSession: state.currentSession ? {
          ...state.currentSession,
          items: state.currentSession.items.filter(item => item.productId !== action.payload)
        } : state.currentSession
      };
    
    case 'DELETE_SESSION':
      // Track deleted session ID with timestamp to prevent it from coming back during sync
      const deletedSessions = JSON.parse(localStorage.getItem('deleted-sessions') || '[]');
      const deletedSessionsWithTimestamp = JSON.parse(localStorage.getItem('deleted-sessions-with-timestamp') || '[]');
      
      deletedSessions.push(action.payload);
      deletedSessionsWithTimestamp.push({
        sessionId: action.payload,
        timestamp: Date.now()
      });
      
      localStorage.setItem('deleted-sessions', JSON.stringify(deletedSessions));
      localStorage.setItem('deleted-sessions-with-timestamp', JSON.stringify(deletedSessionsWithTimestamp));
      
      return {
        ...state,
        sessions: state.sessions.filter((session: InventorySession) => session.id !== action.payload),
        orderHistory: state.orderHistory.filter((item: OrderHistoryItem) => item.sessionId !== action.payload),
      };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(true); // Enable by default
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Function to get last order info for a product at a location within 12 months
  const getLastOrderInfo = (productId: string, locationId: string): { date: string; quantity?: number } | null => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const productOrders = state.orderHistory
      .filter(order => 
        order.productId === productId && 
        order.locationId === locationId &&
        new Date(order.orderDate) >= twelveMonthsAgo
      )
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    if (productOrders.length === 0) return null;

    const lastOrder = productOrders[0];
    return {
      date: lastOrder.orderDate,
      quantity: lastOrder.quantityOrdered,
    };
  };

  const syncWithSupabase = async (forcePullFirst: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting Supabase sync...', { forcePullFirst });

      const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
      const savedSupabaseKey = localStorage.getItem('supabaseKey');

      console.log('Supabase credentials:', { 
        hasUrl: !!savedSupabaseUrl, 
        hasKey: !!savedSupabaseKey,
        url: savedSupabaseUrl?.substring(0, 30) + '...' 
      });

      if (!savedSupabaseUrl || !savedSupabaseKey) {
        throw new Error('Supabase not configured. Please set up in Settings.');
      }

      // Dynamic import to avoid loading Supabase on app start if not needed
      const { SupabaseService } = await import('../services/supabase');
      const supabaseService = new SupabaseService();
      
      console.log('Initializing Supabase service...');
      const initialized = supabaseService.initialize(savedSupabaseUrl, savedSupabaseKey);
      if (!initialized) {
        throw new Error('Failed to initialize Supabase connection');
      }

      // Test connection
      console.log('Testing Supabase connection...');
      const connectionTest = await supabaseService.testConnection();
      if (!connectionTest) {
        throw new Error('Failed to connect to Supabase database');
      }
      console.log('Supabase connection successful!');

      if (forcePullFirst) {
        console.log('🔄 Database-first sync: Pulling latest data from Supabase...');
        
        // FIRST: Pull data from Supabase to get latest state
        const data = await supabaseService.syncFromDatabase();
        const settings = await supabaseService.getAppSettings();
        
        console.log('Database data retrieved:', {
          locations: data.locations.length,
          categories: data.categories.length,
          suppliers: data.suppliers.length,
          products: data.products.length,
          sessions: data.sessions.length
        });

        // Filter out sessions that were locally deleted
        const deletedSessions = JSON.parse(localStorage.getItem('deleted-sessions') || '[]');
        const filteredSessions = data.sessions.filter(session => !deletedSessions.includes(session.id));
        const filteredOrderHistory = data.orderHistory.filter(item => !deletedSessions.includes(item.sessionId));
        
        // Filter out categories that were locally deleted
        const deletedCategories = JSON.parse(localStorage.getItem('deleted-categories') || '[]');
        const filteredCategories = data.categories.filter(category => !deletedCategories.includes(category.id));
        
        // Filter out products that were locally deleted
        const deletedProducts = JSON.parse(localStorage.getItem('deleted-products') || '[]');
        const filteredProducts = data.products.filter(product => !deletedProducts.includes(product.id));
        
        if (filteredSessions.length !== data.sessions.length) {
          console.log(`Filtered out ${data.sessions.length - filteredSessions.length} locally deleted sessions`);
        }
        
        if (filteredCategories.length !== data.categories.length) {
          console.log(`Filtered out ${data.categories.length - filteredCategories.length} locally deleted categories`);
        }
        
        if (filteredProducts.length !== data.products.length) {
          console.log(`Filtered out ${data.products.length - filteredProducts.length} locally deleted products`);
        }

        // Update state with database data
        dispatch({ type: 'SET_LOCATIONS', payload: data.locations });
        dispatch({ type: 'SET_CATEGORIES', payload: filteredCategories });
        dispatch({ type: 'SET_SUPPLIERS', payload: data.suppliers });
        dispatch({ type: 'SET_PRODUCTS', payload: filteredProducts });
        dispatch({ type: 'SET_SESSIONS', payload: filteredSessions });
        dispatch({ type: 'SET_ORDER_HISTORY', payload: filteredOrderHistory });

        // Preserve current session if it exists and isn't in the synced sessions
        if (state.currentSession && !filteredSessions.find(s => s.id === state.currentSession!.id)) {
          console.log('Preserving current session that was not in sync data');
        }

        // Update localStorage with database data
        localStorage.setItem('cafe-inventory-locations', JSON.stringify(data.locations));
        localStorage.setItem('cafe-inventory-categories', JSON.stringify(filteredCategories));
        localStorage.setItem('cafe-inventory-suppliers', JSON.stringify(data.suppliers));
        localStorage.setItem('cafe-inventory-products', JSON.stringify(filteredProducts));
        localStorage.setItem('cafe-inventory-sessions', JSON.stringify(filteredSessions));
        localStorage.setItem('cafe-inventory-order-history', JSON.stringify(filteredOrderHistory));
        
        // Update email settings from database
        if (settings.emailServiceId) {
          localStorage.setItem('emailServiceId', settings.emailServiceId);
        }
        if (settings.emailTemplateId) {
          localStorage.setItem('emailTemplateId', settings.emailTemplateId);
        }
        if (settings.emailPublicKey) {
          localStorage.setItem('emailPublicKey', settings.emailPublicKey);
        }

        // Update email-config object if all parts are available
        if (settings.emailServiceId && settings.emailTemplateId && settings.emailPublicKey) {
          const emailConfig = {
            serviceId: settings.emailServiceId,
            templateId: settings.emailTemplateId,
            publicKey: settings.emailPublicKey
          };
          localStorage.setItem('email-config', JSON.stringify(emailConfig));
          console.log('Email configuration synced from database');
        }

        console.log('✅ Database-first sync completed successfully!');
        return;
      }

      // Default behavior: Push local changes first, then pull updates
      console.log('📤 Local-first sync: Pushing local data to Supabase...');
      console.log('Local state:', {
        locations: state.locations.length,
        categories: state.categories.length,
        suppliers: state.suppliers.length,
        products: state.products.length,
        sessions: state.sessions.length
      });
      
      // Push all local data to Supabase
      for (const location of state.locations) {
        await supabaseService.upsertLocation(location);
      }
      
      for (const category of state.categories) {
        await supabaseService.upsertCategory(category);
      }
      
      for (const supplier of state.suppliers) {
        await supabaseService.upsertSupplier(supplier);
      }
      
      for (const product of state.products) {
        await supabaseService.upsertProduct(product);
      }
      
      for (const session of state.sessions) {
        await supabaseService.upsertSession(session);
      }

      if (state.orderHistory.length > 0) {
        await supabaseService.addOrderHistoryItems(state.orderHistory);
      }

      // Push email settings to Supabase
      const emailServiceId = localStorage.getItem('emailServiceId');
      const emailTemplateId = localStorage.getItem('emailTemplateId');
      const emailPublicKey = localStorage.getItem('emailPublicKey');
      
      if (emailServiceId && emailTemplateId && emailPublicKey) {
        console.log('Pushing email configuration to Supabase...');
        await Promise.all([
          supabaseService.upsertAppSetting('emailServiceId', emailServiceId),
          supabaseService.upsertAppSetting('emailTemplateId', emailTemplateId),
          supabaseService.upsertAppSetting('emailPublicKey', emailPublicKey),
        ]);
      }

      console.log('Local data push completed!');

      // THEN: Pull fresh data from Supabase (in case others made changes)
      console.log('Pulling fresh data from Supabase...');
      const data = await supabaseService.syncFromDatabase();
      
      // Also pull app settings (email configuration)
      const settings = await supabaseService.getAppSettings();
      
      console.log('Data received from Supabase:', data);
      console.log('Settings received from Supabase:', Object.keys(settings));

      // Filter out sessions that were locally deleted
      const deletedSessions = JSON.parse(localStorage.getItem('deleted-sessions') || '[]');
      const filteredSessions = data.sessions.filter(session => !deletedSessions.includes(session.id));
      const filteredOrderHistory = data.orderHistory.filter(item => !deletedSessions.includes(item.sessionId));
      
      // Filter out categories that were locally deleted
      const deletedCategories = JSON.parse(localStorage.getItem('deleted-categories') || '[]');
      const filteredCategories = data.categories.filter(category => !deletedCategories.includes(category.id));
      
      // Filter out products that were locally deleted
      const deletedProducts = JSON.parse(localStorage.getItem('deleted-products') || '[]');
      const filteredProducts = data.products.filter(product => !deletedProducts.includes(product.id));
      
      if (filteredSessions.length !== data.sessions.length) {
        console.log(`Filtered out ${data.sessions.length - filteredSessions.length} locally deleted sessions`);
      }
      
      if (filteredCategories.length !== data.categories.length) {
        console.log(`Filtered out ${data.categories.length - filteredCategories.length} locally deleted categories`);
      }
      
      if (filteredProducts.length !== data.products.length) {
        console.log(`Filtered out ${data.products.length - filteredProducts.length} locally deleted products`);
      }

      dispatch({ type: 'SET_LOCATIONS', payload: data.locations });
      dispatch({ type: 'SET_CATEGORIES', payload: filteredCategories });
      dispatch({ type: 'SET_SUPPLIERS', payload: data.suppliers });
      dispatch({ type: 'SET_PRODUCTS', payload: filteredProducts });
      dispatch({ type: 'SET_SESSIONS', payload: filteredSessions });
      dispatch({ type: 'SET_ORDER_HISTORY', payload: filteredOrderHistory });

      // Preserve current session if it exists and isn't in the synced sessions
      if (state.currentSession && !filteredSessions.find(s => s.id === state.currentSession!.id)) {
        console.log('Preserving current session that was not in sync data');
        // Don't dispatch SET_CURRENT_SESSION here, just leave it as is
        // The current session is still valid and should remain active
      }

      // Also save to localStorage as backup
      localStorage.setItem('cafe-inventory-locations', JSON.stringify(data.locations));
      localStorage.setItem('cafe-inventory-categories', JSON.stringify(filteredCategories));
      localStorage.setItem('cafe-inventory-suppliers', JSON.stringify(data.suppliers));
      localStorage.setItem('cafe-inventory-products', JSON.stringify(filteredProducts));
      localStorage.setItem('cafe-inventory-sessions', JSON.stringify(filteredSessions));
      localStorage.setItem('cafe-inventory-order-history', JSON.stringify(filteredOrderHistory));
      
      // Save email settings from database
      if (settings.emailServiceId) {
        localStorage.setItem('emailServiceId', settings.emailServiceId);
      }
      if (settings.emailTemplateId) {
        localStorage.setItem('emailTemplateId', settings.emailTemplateId);
      }
      if (settings.emailPublicKey) {
        localStorage.setItem('emailPublicKey', settings.emailPublicKey);
      }

      // Update email-config object if all parts are available
      if (settings.emailServiceId && settings.emailTemplateId && settings.emailPublicKey) {
        const emailConfig = {
          serviceId: settings.emailServiceId,
          templateId: settings.emailTemplateId,
          publicKey: settings.emailPublicKey
        };
        localStorage.setItem('email-config', JSON.stringify(emailConfig));
        console.log('Email configuration synced from database');
      }
      
      // Clean up old deleted session tracking (older than 30 days)
      // This prevents the deleted-sessions list from growing indefinitely
      const cleanupThreshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const deletedSessionsWithTimestamp = JSON.parse(localStorage.getItem('deleted-sessions-with-timestamp') || '[]');
      const validDeletedSessions = deletedSessionsWithTimestamp.filter((entry: any) => entry.timestamp > cleanupThreshold);
      
      // Update the simple deleted-sessions list with only recent deletions
      const recentDeletedSessions = validDeletedSessions.map((entry: any) => entry.sessionId);
      localStorage.setItem('deleted-sessions', JSON.stringify(recentDeletedSessions));
      localStorage.setItem('deleted-sessions-with-timestamp', JSON.stringify(validDeletedSessions));
      
      // Clean up deleted categories list as well (same 30-day threshold)
      const deletedCategoriesWithTimestamp = JSON.parse(localStorage.getItem('deleted-categories-with-timestamp') || '[]');
      const validDeletedCategories = deletedCategoriesWithTimestamp.filter((entry: any) => entry.timestamp > cleanupThreshold);
      
      // Update the simple deleted-categories list with only recent deletions
      const recentDeletedCategories = validDeletedCategories.map((entry: any) => entry.categoryId);
      localStorage.setItem('deleted-categories', JSON.stringify(recentDeletedCategories));
      localStorage.setItem('deleted-categories-with-timestamp', JSON.stringify(validDeletedCategories));
      
      // Clean up deleted products list as well (same 30-day threshold)
      const deletedProductsWithTimestamp = JSON.parse(localStorage.getItem('deleted-products-with-timestamp') || '[]');
      const validDeletedProducts = deletedProductsWithTimestamp.filter((entry: any) => entry.timestamp > cleanupThreshold);
      
      // Update the simple deleted-products list with only recent deletions
      const recentDeletedProducts = validDeletedProducts.map((entry: any) => entry.productId);
      localStorage.setItem('deleted-products', JSON.stringify(recentDeletedProducts));
      localStorage.setItem('deleted-products-with-timestamp', JSON.stringify(validDeletedProducts));
      
      console.log('Supabase sync completed successfully!');

    } catch (error) {
      console.error('Supabase sync error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync with Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync function with fallback to localStorage
  const autoSyncWithSupabase = async () => {
    try {
      const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
      const savedSupabaseKey = localStorage.getItem('supabaseKey');

      if (!savedSupabaseUrl || !savedSupabaseKey) {
        console.log('Supabase not configured, skipping auto-sync');
        return false;
      }

      // Don't auto-sync if there's an active session to avoid disrupting user workflow
      if (state.currentSession && !state.currentSession.isSubmitted) {
        console.log('Skipping auto-sync: active session in progress');
        return false;
      }

      console.log('Starting automatic Supabase sync...');
      await syncWithSupabase();
      console.log('Automatic Supabase sync completed successfully');
      return true;
    } catch (error) {
      console.warn('Auto-sync with Supabase failed, falling back to localStorage:', error);
      // Don't set error state for auto-sync failures, just log them
      return false;
    }
  };

  // Convenience function for pulling database changes
  const pullFromDatabase = async () => {
    await syncWithSupabase(true);
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    isLoading,
    error,
    getLastOrderInfo,
    syncWithSupabase,
    pullFromDatabase,
    autoSyncEnabled,
    setAutoSyncEnabled,
    isInitialized,
  };

  // Load email configuration from database
  const loadEmailConfigFromDatabase = async () => {
    try {
      const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
      const savedSupabaseKey = localStorage.getItem('supabaseKey');

      if (!savedSupabaseUrl || !savedSupabaseKey) {
        console.log('Supabase not configured, skipping email config sync');
        return;
      }

      console.log('Loading email configuration from database...');
      const { SupabaseService } = await import('../services/supabase');
      const supabaseService = new SupabaseService();
      supabaseService.initialize(savedSupabaseUrl, savedSupabaseKey);

      const settings = await supabaseService.getAppSettings();
      
      // Load email settings if they exist in database
      if (settings.emailServiceId) {
        localStorage.setItem('emailServiceId', settings.emailServiceId);
        console.log('Loaded email service ID from database');
      }
      if (settings.emailTemplateId) {
        localStorage.setItem('emailTemplateId', settings.emailTemplateId);
        console.log('Loaded email template ID from database');
      }
      if (settings.emailPublicKey) {
        localStorage.setItem('emailPublicKey', settings.emailPublicKey);
        console.log('Loaded email public key from database');
      }

      // Create email-config object for compatibility
      if (settings.emailServiceId && settings.emailTemplateId && settings.emailPublicKey) {
        const emailConfig = {
          serviceId: settings.emailServiceId,
          templateId: settings.emailTemplateId,
          publicKey: settings.emailPublicKey
        };
        localStorage.setItem('email-config', JSON.stringify(emailConfig));
        console.log('Email configuration loaded and synchronized from database');
      }

    } catch (error) {
      console.warn('Failed to load email configuration from database:', error);
    }
  };

  // Load initial data from localStorage and auto-sync with Supabase
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // First, load from localStorage for immediate display
        const storedLocations = localStorage.getItem('cafe-inventory-locations');
        const storedCategories = localStorage.getItem('cafe-inventory-categories');
        const storedSuppliers = localStorage.getItem('cafe-inventory-suppliers');
        const storedProducts = localStorage.getItem('cafe-inventory-products');
        const storedSessions = localStorage.getItem('cafe-inventory-sessions');
        const storedOrderHistory = localStorage.getItem('cafe-inventory-order-history');

        if (storedLocations) {
          dispatch({ type: 'SET_LOCATIONS', payload: JSON.parse(storedLocations) });
        } else {
          // Set default locations
          const defaultLocations: Location[] = [
            { id: '1', name: 'Main Location', address: '123 Main St' },
            { id: '2', name: 'Second Location', address: '456 Oak Ave' },
          ];
          dispatch({ type: 'SET_LOCATIONS', payload: defaultLocations });
          localStorage.setItem('cafe-inventory-locations', JSON.stringify(defaultLocations));
        }

        if (storedCategories) {
          dispatch({ type: 'SET_CATEGORIES', payload: JSON.parse(storedCategories) });
        } else {
          // Set default categories
          const defaultCategories: Category[] = [
            { id: '1', name: 'Milks', color: '#E3F2FD' },
            { id: '2', name: 'Cafe', color: '#FFF3E0' },
            { id: '3', name: 'Food', color: '#E8F5E8' },
            { id: '4', name: 'Supplies', color: '#FCE4EC' },
          ];
          dispatch({ type: 'SET_CATEGORIES', payload: defaultCategories });
          localStorage.setItem('cafe-inventory-categories', JSON.stringify(defaultCategories));
        }

        if (storedSuppliers) {
          dispatch({ type: 'SET_SUPPLIERS', payload: JSON.parse(storedSuppliers) });
        } else {
          // Set default suppliers
          const defaultSuppliers: Supplier[] = [
            { id: '1', name: 'Costco' },
            { id: '2', name: 'Sysco' },
            { id: '3', name: 'Shoreline' },
            { id: '4', name: 'Trader Joes' },
          ];
          dispatch({ type: 'SET_SUPPLIERS', payload: defaultSuppliers });
          localStorage.setItem('cafe-inventory-suppliers', JSON.stringify(defaultSuppliers));
        }

        if (storedProducts) {
          dispatch({ type: 'SET_PRODUCTS', payload: JSON.parse(storedProducts) });
        } else {
          // Add some sample products
          const defaultProducts: Product[] = [
            {
              id: '1',
              name: 'Whole Milk',
              categories: ['1', '2'], // Milks, Cafe
              suppliers: ['1'], // Costco
              requiresQuantity: true,
              locations: [
                { locationId: '1', minThreshold: 5, isAvailable: true },
                { locationId: '2', minThreshold: 3, isAvailable: true },
              ],
            },
            {
              id: '2',
              name: 'Coffee Beans',
              categories: ['2'], // Cafe
              suppliers: ['2'], // Sysco
              requiresQuantity: true,
              locations: [
                { locationId: '1', minThreshold: 10, isAvailable: true },
                { locationId: '2', minThreshold: 8, isAvailable: true },
              ],
            },
            {
              id: '3',
              name: 'Sugar Packets',
              categories: ['4'], // Supplies
              suppliers: ['4'], // Trader Joes
              requiresQuantity: false,
              locations: [
                { locationId: '1', isAvailable: true },
                { locationId: '2', isAvailable: true },
              ],
            },
          ];
          dispatch({ type: 'SET_PRODUCTS', payload: defaultProducts });
          localStorage.setItem('cafe-inventory-products', JSON.stringify(defaultProducts));
        }

        if (storedSessions) {
          dispatch({ type: 'SET_SESSIONS', payload: JSON.parse(storedSessions) });
        }

        if (storedOrderHistory) {
          dispatch({ type: 'SET_ORDER_HISTORY', payload: JSON.parse(storedOrderHistory) });
        } else {
          // Add some sample order history for demonstration
          const sampleOrderHistory: OrderHistoryItem[] = [
            {
              productId: '1',
              locationId: '1',
              orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
              quantityOrdered: 12,
              sessionId: 'sample-session-1',
              suppliers: ['supplier-1'],
              categoryIds: ['category-1'],
            },
            {
              productId: '2',
              locationId: '1',
              orderDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
              quantityOrdered: 20,
              sessionId: 'sample-session-2',
              suppliers: ['supplier-2'],
              categoryIds: ['category-2'],
            },
          ];
          dispatch({ type: 'SET_ORDER_HISTORY', payload: sampleOrderHistory });
          localStorage.setItem('cafe-inventory-order-history', JSON.stringify(sampleOrderHistory));
        }

        setIsInitialized(true);
        
        // After loading localStorage data, try to sync with Supabase
        if (autoSyncEnabled) {
          console.log('Attempting auto-sync with Supabase on startup...');
          const syncSuccess = await autoSyncWithSupabase();
          if (syncSuccess) {
            console.log('Initial Supabase sync completed');
          } else {
            console.log('Using localStorage data (Supabase sync skipped)');
          }
        }

        // Load email configuration from database if available
        await loadEmailConfigFromDatabase();
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [autoSyncEnabled]);

  // Set up periodic auto-sync (every 15 minutes when enabled and no active session)
  useEffect(() => {
    if (!autoSyncEnabled || !isInitialized) return;

    const interval = setInterval(async () => {
      // Only sync if there's no active session
      if (!state.currentSession || state.currentSession.isSubmitted) {
        console.log('Running periodic Supabase sync...');
        await autoSyncWithSupabase();
      } else {
        console.log('Skipping periodic sync: active session in progress');
      }
    }, 15 * 60 * 1000); // 15 minutes instead of 5

    return () => clearInterval(interval);
  }, [autoSyncEnabled, isInitialized, state.currentSession]);

  // Sync when window regains focus (but not if there's an active session)
  useEffect(() => {
    if (!autoSyncEnabled || !isInitialized) return;

    const handleFocus = async () => {
      // Only sync if there's no active session
      if (!state.currentSession || state.currentSession.isSubmitted) {
        console.log('Window regained focus, syncing with Supabase...');
        await autoSyncWithSupabase();
      } else {
        console.log('Window regained focus, but skipping sync due to active session');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [autoSyncEnabled, isInitialized, state.currentSession]);

  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('cafe-inventory-locations', JSON.stringify(state.locations));
  }, [state.locations]);

  useEffect(() => {
    localStorage.setItem('cafe-inventory-categories', JSON.stringify(state.categories));
  }, [state.categories]);

  useEffect(() => {
    localStorage.setItem('cafe-inventory-suppliers', JSON.stringify(state.suppliers));
  }, [state.suppliers]);

  useEffect(() => {
    localStorage.setItem('cafe-inventory-products', JSON.stringify(state.products));
  }, [state.products]);

  useEffect(() => {
    localStorage.setItem('cafe-inventory-sessions', JSON.stringify(state.sessions));
  }, [state.sessions]);

  useEffect(() => {
    localStorage.setItem('cafe-inventory-order-history', JSON.stringify(state.orderHistory));
  }, [state.orderHistory]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
