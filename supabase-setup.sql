-- Supabase Database Setup for Cafe Inventory Manager
-- Run these SQL commands in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
-- This ensures data security in production

-- 1. Locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id text PRIMARY KEY,
    name text NOT NULL,
    address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust for production)
CREATE POLICY "Allow all operations on locations" ON public.locations
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id text PRIMARY KEY,
    name text NOT NULL,
    color text DEFAULT '#E3F2FD',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on suppliers" ON public.suppliers
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Products table
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    name text NOT NULL,
    categories text[] DEFAULT '{}',
    suppliers text[] DEFAULT '{}',
    requires_quantity boolean DEFAULT false,
    locations jsonb DEFAULT '[]',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on products" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id text PRIMARY KEY,
    location_id text NOT NULL,
    user_name text NOT NULL,
    start_date text NOT NULL,
    end_date text,
    items jsonb DEFAULT '[]',
    is_submitted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on sessions" ON public.sessions
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Order History table
CREATE TABLE IF NOT EXISTS public.order_history (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    product_id text NOT NULL,
    location_id text NOT NULL,
    order_date text NOT NULL,
    quantity_ordered integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on order_history" ON public.order_history
    FOR ALL USING (true) WITH CHECK (true);

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_location_id ON public.sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_submitted ON public.sessions(is_submitted);
CREATE INDEX IF NOT EXISTS idx_order_history_product_id ON public.order_history(product_id);
CREATE INDEX IF NOT EXISTS idx_order_history_location_id ON public.order_history(location_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_date ON public.order_history(order_date);

-- Insert some sample data (optional)
INSERT INTO public.locations (id, name, address) VALUES 
    ('1', 'Morning Lavender Downtown', '123 Main St, Downtown'),
    ('2', 'Morning Lavender Uptown', '456 Oak Ave, Uptown')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, color) VALUES 
    ('1', 'Milk & Dairy', '#87CEEB'),
    ('2', 'Coffee & Tea', '#8B4513'),
    ('3', 'Pastries & Food', '#FFD700'),
    ('4', 'Supplies', '#DDA0DD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, name) VALUES 
    ('1', 'Costco'),
    ('2', 'Sysco'),
    ('3', 'Local Bakery'),
    ('4', 'Shoreline')
ON CONFLICT (id) DO NOTHING;
