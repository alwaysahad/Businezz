import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client (only if configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Database table names
export const TABLES = {
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  BUSINESS: 'business_profile',
  SETTINGS: 'settings',
};

// Helper to check connection
export const checkConnection = async () => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(TABLES.BUSINESS).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
