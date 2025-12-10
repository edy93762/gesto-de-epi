
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
}

export interface EpiRecord {
  id: string;
  employeeName: string;
  cpf?: string; // Armazena CPF/Matrícula no registro
  admissionDate?: string; // Armazena Data de Admissão no registro
  shift: string;
  items: EpiItem[]; 
  date: string;
  safetyInstructions?: string;
  signed: boolean;
  autoDeleteAt?: string; // Data de expiração específica para este registro
  facePhoto?: string; // Foto de reconhecimento facial (base64)
}

export interface DashboardStats {
  totalAssignments: number;
  uniqueEmployees: number;
  recentActivity: number;
}

export type AutoDeleteUnit = 'minutes' | 'days' | 'months';

export interface AutoDeleteConfig {
  defaultEnabled: boolean;
  defaultValue: number;
  defaultUnit: AutoDeleteUnit;
  autoBackup: boolean; // Nova configuração para download automático
}
