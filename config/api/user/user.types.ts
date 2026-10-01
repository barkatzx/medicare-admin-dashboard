export interface User {
  id: string;
  email: string;
  phone_number: string;
  name: string | null;
  pharmacy_name: string | null;
  role: "admin" | "customer";
  isApproved: boolean;
  createdAt?: string;
}
