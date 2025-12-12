import { createClient } from '@supabase/supabase-js';

// Using type assertion to avoid TypeScript errors when 'vite/client' types are missing
const env = (import.meta as any).env;

// Estas variáveis devem ser configuradas no arquivo .env (local) e nas Variáveis de Ambiente da Vercel (produção)
const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem antes de criar o cliente
// Isso evita erros fatais se o banco de dados ainda não estiver configurado
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper para verificar conexão
export const checkDbConnection = async () => {
  if (!supabase) {
    console.warn("Supabase não configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('epi_records').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao conectar no Supabase:", error);
    return false;
  }
};