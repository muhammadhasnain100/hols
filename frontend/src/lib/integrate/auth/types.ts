export type UserRole = "student" | "admin" | "affiliate";

export type LoginPayload = {
  email: string;
  password: string;
  role: UserRole;
};

export type LoginOtpRequired = {
  otp_required: true;
  otp_token: string;
  message: string;
  expires_in: number;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  otp_required?: boolean;
};

export type LoginSuccess = AuthTokens & {
  role: UserRole;
  user_id: string;
  profile: Record<string, unknown>;
};

export type SignupPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  marketing_pref?: boolean;
  referred_by_affiliate_id?: string;
};

export type SignupSuccess = {
  message: string;
  user_id: string;
  profile: Record<string, unknown>;
};

export type StoredUser = {
  user_id: string;
  role: UserRole;
  profile: Record<string, unknown>;
};

export type ProfileData = {
  profile: Record<string, unknown>;
  access: Record<string, unknown>;
};

export type ProfileUpdatePayload = {
  first_name?: string;
  last_name?: string;
  address?: Record<string, unknown>;
  marketing_pref?: boolean;
  margin_percent?: number;
  invite_code?: string;
  role?: UserRole;
};
