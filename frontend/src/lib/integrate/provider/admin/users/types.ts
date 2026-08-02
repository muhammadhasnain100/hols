export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_page?: number | null;
  previous_page?: number | null;
  next_cursor?: string | null;
};

export type AffiliateSummary = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  invite_code?: string;
  margin_percent?: number;
  invitation_quota?: number;
  student_count: number;
  total_earned?: number;
  earnings_currency?: string;
  created_at?: string;
};

export type StudentAffiliateInfo = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  invite_code?: string;
  margin_percent?: number;
  invitation_quota?: number;
  student_count: number;
  created_at?: string;
};

export type StudentSummary = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  marketing_pref: boolean;
  referred_by_affiliate_id?: string;
  affiliate?: StudentAffiliateInfo | null;
  created_at?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string;
};
