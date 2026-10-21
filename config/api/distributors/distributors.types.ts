export interface DistributorArea {
  id: string;
  code?: string;
  name: string;
  bnName?: string;
}

export interface DistributorInput {
  fullAddress?: string | null;
  divisionId?: string | null;
  districtId?: string | null;
  upazilaId?: string | null;
}

export interface Distributor extends DistributorInput {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  productsCount?: number;
  division?: DistributorArea | null;
  district?: DistributorArea | null;
  upazila?: DistributorArea | null;
}
