import { apiClient } from "../client";
import type { DistributorArea } from "../distributors/distributors.types";

export type LocationArea = DistributorArea;

export async function getDivisions(): Promise<LocationArea[]> {
  const result = await apiClient.request("/locations/divisions");
  return Array.isArray(result) ? result : [];
}

export async function getDistricts(
  divisionId: string,
): Promise<LocationArea[]> {
  const result = await apiClient.request(
    `/locations/districts?divisionId=${encodeURIComponent(divisionId)}`,
  );
  return Array.isArray(result) ? result : [];
}

export async function getUpazilas(
  districtId: string,
): Promise<LocationArea[]> {
  const result = await apiClient.request(
    `/locations/upazilas?districtId=${encodeURIComponent(districtId)}`,
  );
  return Array.isArray(result) ? result : [];
}
