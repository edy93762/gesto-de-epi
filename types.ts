
export interface Collaborator {
  id: string; 
  name: string; 
  cpf: string; 
  sector: string; 
  role: string; 
  branch: string; 
  shift: 'T1' | 'T2' | 'T3' | 'T4' | 'T5'; 
  managerName: string; 
  managerEmail: string; 
  active: boolean; 
}

export interface EPI {
  id: string; 
  description: string; 
  active: boolean; 
  createdAt: string;
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
