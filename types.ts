
export interface Collaborator {
  id: string; 
  name: string; 
  matricula: string; // Será usado como CPF/Matrícula
  sector: string; 
  role: string; 
  branch: string; 
  managerName: string; 
  managerEmail: string; // Novo campo obrigatório
  active: boolean; 
  // photo removido conforme solicitado
}

export interface EPI {
  id: string; 
  description: string; 
  category: string; 
  active: boolean; 
  createdAt: string;
  ca?: string;
  validityCA?: string;
}

export type DeliveryReason = 'Primeira' | 'Troca validade' | 'Desgaste' | 'Perda' | 'Dano';

export interface Delivery {
  id: string; 
  date: string; 
  collaboratorId: string; 
  epiId: string; 
  reason: DeliveryReason; 
  notes: string; 
  responsibleEmail: string; 
  photo?: string; // Foto da evidência da entrega
  verificationResult?: {
    match: boolean;
    confidence: number;
    reason: string;
  };
}

export type ViewState = 
  | 'dashboard' 
  | 'deliveries' 
  | 'new-delivery' 
  | 'collaborators' 
  | 'new-collaborator'
  | 'epis' 
  | 'new-epi';
