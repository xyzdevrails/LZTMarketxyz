/**
 * Tipos TypeScript para a API do LZT Market
 * Baseado na documentação: https://lzt-market.readme.io/reference/information
 */

export interface LZTResponse<T = any> {
  status_code: number;
  body: T;
}

export interface LZTError {
  error: {
    code: string;
    message: string;
  };
}

export interface LZTAccount {
  item_id: number;
  item_state: string; // active, paid, closed, etc.
  title: string;
  price: number;
  currency: string;
  is_auto: boolean;
  is_steam_guard_enabled?: boolean;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  is_ask_question_enabled?: boolean;
  is_guaranteed?: boolean;
  is_arbitration_allowed?: boolean;
  is_arbitration_used?: boolean;
  is_archived?: boolean;
  is_bumped?: boolean;
  is_favorited?: boolean;
  is_hidden?: boolean;
  is_purchased?: boolean;
  is_reserved?: boolean;
  is_sticked?: boolean;
  category: {
    category_id: number;
    category_name: string;
    category_slug: string;
  };
  game: {
    game_id: number;
    game_name: string;
    game_slug: string;
  };
  seller: {
    user_id: number;
    username: string;
    reputation: number;
  };
  account_data?: {
    login?: string;
    password?: string;
    email?: string;
    email_password?: string;
    phone?: string;
    recovery_codes?: string[];
    additional_data?: Record<string, any>;
  };
  account_credentials?: {
    login?: string;
    password?: string;
    email?: string;
    email_password?: string;
    phone?: string;
    recovery_codes?: string[];
    additional_data?: Record<string, any>;
  };
  account_info?: {
    skins_count?: number;
    valorant_points?: number;
    inventory_value?: number;
    recovery_risk?: 'Baixo' | 'Médio' | 'Alto';
    last_activity?: string;
    current_rank?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    region?: string;
    weapon_skins?: Array<{
      name: string;
      rarity?: string;
      image_url?: string;
    }>;
  };
  // Campos específicos do Riot/Valorant
  riot_item_id?: number;
  riot_id?: string;
  riot_account_verified?: number;
  riot_email_verified?: number;
  riot_phone_verified?: number;
  riot_country?: string;
  riot_password_change?: number;
  riot_last_activity?: number;
  riot_valorant_wallet_vp?: number; // Valorant Points
  riot_valorant_wallet_rp?: number; // Radianite Points
  riot_valorant_wallet_fa?: number; // Free Agents
  tags?: Array<{
    tag_id: number;
    tag_name: string;
  }>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  purchased_at?: string;
}

export interface LZTSearchFilters {
  category?: string;
  game_id?: number;
  price_min?: number;
  price_max?: number;
  currency?: string;
  is_auto?: boolean;
  is_guaranteed?: boolean;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  seller_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
  // Parâmetros específicos da API LZT
  pmin?: number; // Preço mínimo (inclusive)
  pmax?: number; // Preço máximo (inclusive)
  title?: string; // Palavras no título
  order_by?: 'price_to_up' | 'price_to_down' | 'pdate_to_down' | 'pdate_to_up' | 'pdate_to_down_upload' | 'pdate_to_up_upload' | 'edate_to_up' | 'edate_to_down' | 'ddate_to_up' | 'ddate_to_down';
  // Parâmetros específicos do Valorant
  rmin?: number; // Rank mínimo (3-27)
  rmax?: number; // Rank máximo (3-27)
}

export interface LZTSearchResponse {
  items: LZTAccount[];
  totalItems: number;
  totalItemsPrice: number;
  hasNextPage: boolean;
  perPage: number;
  page: number;
  wasCached?: boolean;
  cacheTTL?: number;
  lastModified?: number;
  serverTime?: number;
  searchUrl?: string;
  stickyItems?: LZTAccount[];
  system_info?: {
    visitor_id: number;
    time: number;
  };
  // Compatibilidade com código existente
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface LZTPurchaseResponse {
  item_id: number;
  purchase_id: number;
  status: 'success' | 'pending' | 'failed';
  account_data?: LZTAccount['account_data'];
}

export interface LZTOrder {
  order_id: string;
  item_id: number;
  user_id: string;
  username: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  currency: string;
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
}

