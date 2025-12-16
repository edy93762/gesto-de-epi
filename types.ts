
export interface SafetyInstruction {
  usage: string[];
  maintenance: string[];
}

export interface EpiItem {
  id: string;
  name: string;
  ca?: string; // Opcional
  code?: string; // ID Interno
}

export interface EpiCatalogItem {
  id: string;
  code: string; // ID interno usado para busca
  name: string;
  ca?: string; // Opcional
  stock: number; // Quantidade em estoque
}

export interface Collaborator {
  id: string;
  name: string;
  cpf?: string; // Substituído matrícula por CPF
  shift?: string;
  admissionDate?: string; // Data de admissão
  faceReference?: string; // Foto de referência para reconhecimento facial
  lastActivityDate?: string; // Data da última entrega ou criação
  company?: 'Luandre' | 'Randstad' | 'Shopee'; // Agência do colaborador
}

export interface EpiRecord {
  id: string;
  company: 'Luandre' | 'Randstad' | 'Shopee'; // Nova propriedade
  employeeName: string;
  cpf?: string; 
  admissionDate?: string; 
  shift: string;
  items: EpiItem[]; 
  date: string;
  safetyInstructions?: string;
  signed: boolean;
  facePhoto?: string; 
}

export interface DashboardStats {
  totalAssignments: number;
  uniqueEmployees: number;
  recentActivity: number;
}

export interface AutoDeleteConfig {
  autoBackup: boolean;
  googleSheetsUrl?: string; // URL do Web App do Google Apps Script
}