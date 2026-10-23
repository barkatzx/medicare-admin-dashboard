export type UserRole = "admin" | "customer" | "TSR";

export interface UserLocationArea {
  id: string;
  code: string;
  name: string;
  bnName: string;
}

export interface User {
  id: string;
  email: string;
  phone_number: string;
  name: string | null;
  pharmacy_name: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt?: string;
  fullAddress?: string | null;
  divisionId?: string | null;
  districtId?: string | null;
  upazilaId?: string | null;
  division?: UserLocationArea | null;
  district?: UserLocationArea | null;
  upazila?: UserLocationArea | null;
}

export interface UserProfile {
  id: string;
  email: string;
  phone_number: string;
  name: string | null;
  pharmacy_name: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
  defaultAddressId: string | null;
}

export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
