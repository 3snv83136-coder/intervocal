

export interface InvestigationRow {
  id: string;
  defect: string;
  location: string;
  description: string;
  diagnostic: 'FONCTIONNEL' | 'À REMPLACER' | 'OBSERVATION';
}

export interface OperationPhase {
  title: string;
  context: string;
  action: string;
  constat: string;
  constatsList?: string[];
}

export interface CompanyInfo {
  name: string;
  phone: string;
  email: string;
  logoUrl: string;
  address: string;
  googleReviewUrl?: string;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EstimateData {
  lineItems: EstimateLineItem[];
  subtotal: number;
  vatRate: number; // Stored as a percentage, e.g., 20 for 20%
  vatAmount: number;
  total: number;
  validity: string;
  paymentConditions: string;
}

export interface ReportData {
  id: string;
  timestamp: number;
  client: string;
  chantier: string;
  adresse: string;
  date: string;
  intervenant: string;
  objet: string;
  typeIntervention: string;
  zoneIntervention: string;
  configuration: string;
  phase1: OperationPhase;
  phase2: OperationPhase;
  avisTechnique: {
    title: string;
    description: string;
    diagnosticFinal: string;
    recommandation: string;
  };
  investigations: InvestigationRow[];
  preconisations: {
    rectification: string[];
    maintenance: string[];
  };
  garantie: boolean;
  estimate: EstimateData;
  signatureClient?: string;
  signatureTechnicien?: string;
  rawTranscription?: string;
}
