
export interface Collaborator {
  id: string;
  name: string;
  matricula: string;
  sector: string;
  role: string;
  managerEmail: string;
  active: boolean;
  photo?: string; // Foto de referência para reconhecimento facial
}

export interface EPI {
  id: string; // EPI_ID manual e único
  description: string;
  location: string;
  active: boolean;
  createdAt: string;
}

export type DeliveryReason = 'Primeira' | 'Troca validade' | 'Desgaste' | 'Perda' | 'Dano';

export interface Delivery {
  id: string;
  date: string; // ISO String
  collaboratorId: string;
  epiId: string;
  quantity: number;
  reason: DeliveryReason;
  notes: string;
  responsibleEmail: string;
  photo?: string; // Base64 da imagem capturada na entrega
  verificationResult?: {
    match: boolean;
    confidence: number;
    reason: string;
  };
  predictedReplacementDate?: string;
  status: 'VENCIDO' | 'A VENCER' | 'OK'; 
}

export type ViewState = 
  | 'dashboard' 
  | 'deliveries' 
  | 'new-delivery' 
  | 'collaborators' 
  | 'new-collaborator'
  | 'epis' 
  | 'new-epi';
