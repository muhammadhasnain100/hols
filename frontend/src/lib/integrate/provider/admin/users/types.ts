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
  order_count?: number;
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
  total_spent?: number;
  order_count?: number;
  paid_order_count?: number;
  spend_currency?: string;
  current_plan?: string | null;
  membership_status?: string | null;
  last_purchase_at?: string | null;
  last_purchase_amount?: number | null;
  created_at?: string;
};

export type StudentCommerceSummary = {
  user_id: string;
  total_spent: number;
  order_count: number;
  paid_order_count: number;
  currency: string;
  last_purchase_at?: string | null;
  last_purchase_amount?: number | null;
  last_plan_type?: string | null;
  current_plan?: string | null;
  membership_status?: string | null;
  membership_end_date?: string | null;
};

export type AffiliateCommissionItem = {
  order_id: string;
  student_user_id?: string | null;
  plan_type?: string | null;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  created_at?: string | null;
};

export type AffiliateEarningsSummary = {
  total_earned: number;
  pending_payout: number;
  paid_out: number;
  currency: string;
  order_count: number;
  margin_percent?: number | null;
  next_milestone: number;
  items: AffiliateCommissionItem[];
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string;
};
