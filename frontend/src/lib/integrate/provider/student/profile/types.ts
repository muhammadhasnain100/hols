export type StudentAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
};

export type StudentProfile = {
  user_id: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_pic?: string;
  address?: StudentAddress;
  marketing_pref?: boolean;
  referred_by_affiliate_id?: string;
  email_verified?: boolean;
  created_at?: string;
};

export type StudentProfileUpdate = {
  first_name?: string;
  last_name?: string;
  address?: StudentAddress;
  marketing_pref?: boolean;
};
