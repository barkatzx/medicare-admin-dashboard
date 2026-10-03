export const TSR_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type TsrOrderStatus = (typeof TSR_ORDER_STATUSES)[number];

export interface TerritoryArea {
  id?: string;
  name: string;
  bnName?: string;
}

export interface Territory {
  fullAddress?: string | null;
  division?: TerritoryArea | null;
  district?: TerritoryArea | null;
  upazila?: TerritoryArea | null;
}

export interface TSR {
  id: string;
  name: string | null;
  email: string;
  phone_number?: string | null;
  phone?: string | null;
  fullAddress?: string | null;
  territory?: Territory | null;
  division?: TerritoryArea | null;
  district?: TerritoryArea | null;
  upazila?: TerritoryArea | null;
}

export interface StatusPerformance {
  count?: number | null;
  orders?: number | null;
  totalOrders?: number | null;
  value?: number | string | null;
  orderValue?: number | string | null;
  totalOrderValue?: number | string | null;
}

export type StatusPerformanceMap = Partial<
  Record<TsrOrderStatus, StatusPerformance | number>
>;

export type TSRPerformance = TSR & {
  totalOrders?: number | null;
  totalOrderValue?: number | string | null;
  statusBreakdown?: StatusPerformanceMap;
  statuses?: StatusPerformanceMap;
  statusCounts?: Partial<Record<TsrOrderStatus, number>>;
  statusValues?: Partial<Record<TsrOrderStatus, number | string>>;
  ordersByStatus?: StatusPerformanceMap;
} &
  Partial<Record<TsrOrderStatus, StatusPerformance | number>> &
  Partial<Record<`${TsrOrderStatus}Count`, number>> &
  Partial<Record<`${TsrOrderStatus}OrderValue`, number | string>>;

export interface SummaryResponse extends TSRPerformance {}

export interface TSRDetail extends TSRPerformance {}

export type TSRDetailResponse =
  | TSRDetail
  | (TSRPerformance & {
      tsr: TSRDetail;
      summary?: SummaryResponse;
      performance?: SummaryResponse;
      territoryOrders?: TsrSalesOrder[];
      territoryOrdersPagination?: Pagination;
    });

export interface OrderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  pharmacy_name?: string | null;
  fullAddress?: string | null;
  division?: TerritoryArea | null;
  district?: TerritoryArea | null;
  upazila?: TerritoryArea | null;
}

export interface TsrSalesOrder {
  id: string;
  orderId?: string;
  totalAmount?: number | string | null;
  totalOrderValue?: number | string | null;
  status: string;
  createdAt: string;
  user?: OrderUser | null;
  pharmacy?: { name?: string | null } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TSROrdersResponse {
  orders: TsrSalesOrder[];
  pagination: Pagination;
}
