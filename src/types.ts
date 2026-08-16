export interface FormConfig {
  name: string;
  email: string;
  rating: number;
  comments: string;
}

export interface WorkspaceResources {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  formId: string | null;
  formUrl: string | null;
}

export interface RoutingConfiguration {
  excellentSubject: string;
  excellentBody: string;
  goodSubject: string;
  goodBody: string;
  neutralSubject: string;
  neutralBody: string;
  poorSubject: string;
  poorBody: string;
  supportEmail: string;
  businessSignature?: string;
  companyLogoUrl?: string;
  googleReviewsUrl: string;
  privateFeedbackUrl?: string;
  starThreshold: number;
  yelpEnabled: boolean;
  yelpUrl: string;
  facebookEnabled: boolean;
  facebookUrl: string;
  bbbEnabled: boolean;
  bbbUrl: string;
}

export interface Client {
  id: string;
  name: string;
  language?: 'en' | 'es';
  appUrl?: string;
  logoUrl?: string;
  portalTitle?: string;
  portalSubtitle?: string;
  titleFont?: string;
  titleFontSize?: string;
  titleColor?: string;
  subtitleColor?: string;
  resources: WorkspaceResources;
  routingConfig: RoutingConfiguration;
}

export interface ReviewRecord {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  name: string;
  email: string;
  rating: number;
  comments: string;
  status: 'synced' | 'local';
}

