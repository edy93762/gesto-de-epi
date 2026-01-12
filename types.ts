
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
  id: string; // EPI_ID (Chave na planilha)
  description: string;
  category: string;
  ca: string;
  validityCA: string;
  shelfLifeDays: number;
  location: string;
  active: boolean;
  createdAt: string;
}

export type DeliveryReason = 'Primeira' | 'Troca validade' | 'Desgaste' | 'Perda' | 'Dano';

export interface Delivery {
  id: string; // EntregaID (UNIQUEID na planilha)
  date: string; // Data_Entrega
  collaboratorId: string; // ColaboradorID (Ref)
  epiId: string; // EPI_ID (Ref)
  quantity: number;
  reason: DeliveryReason; // Motivo
  notes: string; // Observacao
  responsibleEmail: string; // ResponsavelEmail
  photo?: string; // Assinatura (Biometria)
  verificationResult?: {
    match: boolean;
    confidence: number;
    reason: string;
  };
  predictedReplacementDate?: string; // Data_Prevista_Troca
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
