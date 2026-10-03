export type UserRole = "admin" | "customer" | "TSR";

export interface User {
  id: string;
  email: string;
  phone_number: string;
  name: string | null;
  pharmacy_name: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt?: string;
}
