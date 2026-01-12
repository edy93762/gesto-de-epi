
export interface Collaborator {
  id: string; // ColaboradorID (Chave)
  name: string; // Nome
  matricula: string; // Matrícula
  sector: string; // Setor
  role: string; // Cargo
  branch: string; // Agência / Unidade (NOVO)
  managerEmail: string; // GestorEmail
  active: boolean; // Ativo (TRUE/FALSE)
  photo?: string; // Para reconhecimento facial (Assinatura base)
}

export interface EPI {
  id: string; // EPI_ID (Chave)
  description: string; // Descrição
  category: string; // Categoria
  ca: string; // CA
  validityCA: string; // Validade_CA
  shelfLifeDays: number; // Vida_Util_Dias
  location: string; // Local (Estoque)
  active: boolean; // Ativo
  createdAt: string;
}

export type DeliveryReason = 'Primeira' | 'Troca validade' | 'Desgaste' | 'Perda' | 'Dano';

export interface Delivery {
  id: string; // EntregaID (UNIQUEID)
  date: string; // Data_Entrega
  collaboratorId: string; // ColaboradorID (Ref)
  epiId: string; // EPI_ID (Ref)
  quantity: number; // Quantidade
  reason: DeliveryReason; // Motivo
  notes: string; // Observacao
  responsibleEmail: string; // ResponsavelEmail
  photo?: string; // Assinatura (Imagem biometria)
  verificationResult?: {
    match: boolean;
    confidence: number;
    reason: string;
  };
  predictedReplacementDate?: string; // Data_Prevista_Troca
  status: 'VENCIDO' | 'A VENCER' | 'OK'; // Status
}

export type ViewState = 
  | 'dashboard' 
  | 'deliveries' 
  | 'new-delivery' 
  | 'collaborators' 
  | 'new-collaborator'
  | 'epis' 
  | 'new-epi';
