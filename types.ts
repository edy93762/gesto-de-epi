
export interface Collaborator {
  id: string; 
  name: string; 
  matricula: string; 
  sector: string; 
  role: string; 
  branch: string; 
  managerName: string; // Alterado de Email para Nome
  active: boolean; 
  photo?: string; 
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
  photo?: string; 
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
