import { ReportData, CompanyInfo } from './types';

// Logo SVG converti pour une qualité parfaite et une permanence totale
const LOGO_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8ZyBmaWxsPSIjMDAzMzRlIj4KICAgIDxwYXRoIGQ9Ik0xNDAgNDQwIGggNDAgdiAtMjAwIGggLTQwIHogTSAxNDAgMjQwIGMgMCA0MCA0MCA0MCA0MCA0MCBoIDEwMCBjIDMwIDAgNjAgLTMwIDYwIC02MCBzIC0zMCAtNjAgLTYwIC02MCBoIC0xMDAgYyAtNDAgMCAtNDAgNDAgLTQwIDQwIHogTSAxODAgMTAwIGggMTQwIGMgNTAgMCA4MCA0MCA4MCA4MCBzIC0zMCA4MCAtODAgODAgaCAtMTQwIHogTSAxODAgNjAgaCAtNDAgdiA0MCBoIDQwIHogTSAyMjAgNjAgaCAtNDAgdiA0MCBoIDQwIHogTSAyNjAgNjAgaCAtNDAgdiA0MCBoIDQwIHogTSAzMDAgNjAgaCAtNDAgdiA0MCBoIDQwIHogTSAzNDAgNjAgaCAtNDAgdiA0MCBoIDQwIHogTSAxNDAgNDgwIGggNDAgdiAtMjAgaCAtNDAgeiIgLz4KICAgIDxyZWN0IHg9IjE0MCIgeT0iNDQwIiB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHJ4PSI1IiAvPgogICAgPHBhdGggZD0iTSAzNDAgMjYwIGggNjAgbCAyMCAzMCBtIC0yMCAtNjAgbCAyMCAtMzAgTSA0MjAgMjYwIGggMjAiIC8+CiAgICA8Y2lyY2xlIGN4PSIzODAiIGN5PSIyOTAiIHI9IjEwIiAvPgogICAgPHRleHQgeD0iMjUwIiB5PSI0MDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSI0NCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TEVTIFRFQ0hOSUNJRU5TPC90ZXh0PgogICAgPHRleHQgeD0iMjUwIiB5PSI0NjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RFUgRMOpQk9VQ0hBR0U8L3RleHQ+CiAgPC9nPgo8L3N2Zz4=`;

export const TECHNICAL_TERMS = [
  { term: "EU / EV / EP", definition: "Eaux Usées (ménagères) / Eaux Vannes (WC) / Eaux Pluviales (pluie)." },
  { term: "Curage / Hydrocurage", definition: "Nettoyage complet des parois d'une canalisation par jet d'eau haute pression." },
  { term: "Regard de visite", definition: "Ouvrage de maçonnerie permettant l'accès aux canalisations pour entretien." },
  { term: "Colonnes montantes", definition: "Canalisations verticales d'un immeuble desservant les différents étages." },
  { term: "Collecteur", definition: "Canalisation horizontale de gros diamètre recevant les eaux des colonnes." },
  { term: "Siphon", definition: "Dispositif retenant une garde d'eau pour empêcher les remontées d'odeurs." },
  { term: "Tampon de visite", definition: "Plaque ou couvercle fermant l'accès à un regard ou une canalisation." },
  { term: "Dépôt calcaire / Tartre", definition: "Accumulation de minéraux réduisant le diamètre intérieur des tubes." },
  { term: "Contre-pente", definition: "Défaut d'inclinaison empêchant l'écoulement naturel des eaux par gravité." },
  { term: "Furet haute pression", definition: "Buse spécifique montée sur flexible pour briser les bouchons." },
  { term: "Culotte / Té", definition: "Raccord de dérivation permettant de joindre deux canalisations." },
  { term: "Obstrution par racines", definition: "Infiltration de racines d'arbres brisant ou bouchant les tuyaux." }
];

export const DEFAULT_COMPANY: CompanyInfo = {
  name: "Les Techniciens du Débouchage",
  phone: "07 83 63 68 35",
  email: "contact@debouchepro.fr",
  logoUrl: LOGO_SVG,
  address: "Expertise Technique & Diagnostic",
  googleReviewUrl: "https://g.page/r/your-id/review"
};

export const INITIAL_REPORT_DATA: ReportData = {
  id: "draft-" + Date.now(),
  timestamp: Date.now(),
  client: "",
  chantier: "Résidence principale",
  adresse: "",
  date: new Date().toLocaleDateString('fr-FR'),
  intervenant: "",
  objet: "Débouchage et Inspection",
  typeIntervention: "Dépannage",
  zoneIntervention: "",
  configuration: "",
  phase1: {
    title: "Phase 1 : Débouchage de la Canalisation",
    context: "",
    action: "Passage du furet haute pression ou pompe manuelle.",
    constat: "Rétablissement de l'écoulement.",
  },
  phase2: {
    title: "Phase 2 : Inspection et Diagnostic",
    context: "Contrôle par caméra après débouchage.",
    action: "Passage de la caméra d'inspection sur l'ensemble du réseau.",
    constat: "",
    constatsList: []
  },
  avisTechnique: {
    title: "Avis Technique & Synthèse",
    description: "",
    diagnosticFinal: "",
    recommandation: ""
  },
  investigations: [],
  preconisations: {
    rectification: [],
    maintenance: [
      "Curage préventif conseillé tous les 5 ans.",
      "Ne pas jeter de lingettes ou de graisses."
    ]
  },
  garantie: true,
  estimate: {
    lineItems: [],
    subtotal: 0,
    vatRate: 20,
    vatAmount: 0,
    total: 0,
    validity: "1 mois",
    paymentConditions: "Paiement immédiat à réception."
  },
  rawTranscription: ""
};