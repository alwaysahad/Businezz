import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client (only if configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Table names
export const TABLES = {
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  BUSINESS: 'business_profile',
  SETTINGS: 'settings',
} as const;
