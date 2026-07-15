import type { ProfileUpdatePayload } from "@/lib/integrate/auth/types";

export type AdminProfile = {
  user_id: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
  address?: Record<string, unknown>;
  marketing_pref?: boolean;
  margin_percent?: number;
  invite_code?: string;
  invitation_quota?: number;
  student_count?: number;
  referred_by_affiliate_id?: string;
  email_verified?: boolean;
  created_at?: string;
};

export type AdminProfileUpdate = ProfileUpdatePayload;

export type ProfileAccess = {
  requester_role: string;
  target_user_id: string;
  can_view: boolean;
  can_edit: boolean;
  editable_fields: string[];
  endpoint: string;
  allowed_roles: string[];
};
