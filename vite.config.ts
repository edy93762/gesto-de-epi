import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente (mesmo sem prefixo VITE_)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Define process.env como objeto vazio para evitar crash 'process is not defined'
      'process.env': {},
      // Injerta especificamente a API_KEY vinda das configurações da Vercel
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});