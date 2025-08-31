export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  url: string;
  industry: string;
  product: string;
  icp: string;
  notes: string;
  uploaded_data_json: Record<string, any>;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  note: string;
  created_at: string;
}
export interface Dashboard {
  id: string;
  name: string;
}

export interface ZoomRecording {
  id: string;
  name: string;
  url: string;
  transcript?: string;
  tileId: string;
  companyId?: string;
  uploadedAt: string;
}

export interface Tile {
  id: string;
  board_id: string;
  title: string;
  base_prompt: string;
  ex_answer: string;
  order: number;
  last_answer: string;
  last_run_context_version: number;
  status: 'idle' | 'loading' | 'error' | 'completed';
  zoom_recordings?: ZoomRecording[];
  type?: 'prompt' | 'notes'; // New field to distinguish tile types
  company_id?: number; // Company ID for notes tiles
  dashboard_id?: number; // Dashboard ID for notes tiles
  position?: { // Position for notes tiles
    x: number;
    y: number;
    width: number;
    height: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TileMessage {
  id: string;
  tile_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// AI-generated contact info shape (not persisted by default)
export interface AIContactInfo {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
}

export interface AppState {
  companies: Company[];
  selectedCompany: Company | null;
  selectedCompanyId: string | null;

  contacts: Contact[];
  selectedContact: Contact | null;
  selectedContactId: string | null;

  dashboards: Dashboard[];

  contextVersion: number;
  tiles: Tile[];
  boards: Board[];
  currentBoardId: string | null;
}

export interface AIRequest {
  tileId: string;
  basePrompt: string;
  userRefinement?: string;
  companyId: string;
  lastNHistory?: TileMessage[];
  contextVersion: number;
  zoomRecordings?: {
    recordings: Array<{name: string, transcript: string}>;
    summary: string;
  } | null;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  contextVersion: number;
}