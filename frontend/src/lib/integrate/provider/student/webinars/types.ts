export type WebinarSummary = {
  webinar_id: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  price: number;
  currency: string;
  capacity: number;
  seats_taken: number;
  seats_remaining: number;
  status: string;
  join_url?: string | null;
  thumbnail_url?: string | null;
  is_booked?: boolean;
  created_at?: string | null;
};

export type WebinarRegistration = {
  webinar_id: string;
  user_id: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at?: string | null;
  webinar_title?: string | null;
  starts_at?: string | null;
  join_url?: string | null;
};

export type WebinarNotification = {
  webinar_id: string;
  title: string;
  starts_at: string;
  price: number;
  currency: string;
  is_booked: boolean;
  body: string;
};

export type WebinarCreatePayload = {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  price: number;
  currency?: string;
  capacity: number;
  join_url: string;
  status: "draft" | "published" | "cancelled" | "completed";
};

export type WebinarUpdatePayload = Partial<WebinarCreatePayload>;

export function formatWebinarWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
