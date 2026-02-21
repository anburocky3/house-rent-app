export type Role = "admin" | "tenant";

export type UserProfile = {
  uid?: string;
  role?: Role;
  phone_number?: string;
  upi_id?: string;
  pincode?: string;
  tenant_entered?: unknown;
  gender?: string;
  dob?: unknown;
  father_name?: string;
  aadhaar_info?: {
    number?: string;
    last4?: string;
  };
  guardian_info?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  created_at?: unknown;
  updated_at?: unknown;
  [key: string]: unknown;
};
