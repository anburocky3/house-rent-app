export type Role = "admin" | "tenant";

export type UserProfile = {
  uid?: string;
  auth_uid?: string;
  role?: Role;
  phone_number?: string;
  upi_id?: string;
  fcmToken?: string;
  notification_permission?: NotificationPermission | string;
  pincode?: string;
  permanent_address?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    pincode?: string;
    address?: string;
  };
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
