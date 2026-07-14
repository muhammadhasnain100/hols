export type PlanType = "monthly" | "biannual" | "annual";

export type Plan = {
  plan_type: PlanType;
  price: number;
  currency: string;
  duration_days: number;
  updated_by?: string;
  updated_at?: string;
};

export type Membership = {
  plan_type: PlanType;
  status: string;
  start_date: string;
  end_date: string;
  order_id: string;
  plan_price: number;
  currency: string;
};

export type PaymentCard = {
  payment_method_id: string;
  card_holder_name?: string;
  card_number_masked: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  brand?: string;
  is_default: boolean;
  has_cvc: boolean;
  has_pin: boolean;
  billing_address?: Record<string, unknown>;
  created_at?: string;
};

export type Order = {
  order_id: string;
  plan_type: PlanType;
  amount: number;
  currency: string;
  status: string;
  payment_method_id?: string;
  created_at: string;
};

export type CardCreatePayload = {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  pin?: string;
  card_holder_name?: string;
  is_default?: boolean;
  billing_address?: Record<string, unknown>;
};

export type CardUpdatePayload = {
  card_number?: string;
  exp_month?: number;
  exp_year?: number;
  cvc?: string;
  pin?: string;
  card_holder_name?: string;
  is_default?: boolean;
  billing_address?: Record<string, unknown>;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  next_cursor?: string | null;
};

export const planLabels: Record<PlanType, string> = {
  monthly: "Monthly",
  biannual: "Biannual",
  annual: "Annual",
};

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
