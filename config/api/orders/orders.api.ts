import { apiClient } from "../client";
import type { Order, OrderPagination, Payment } from "./orders.types";

export async function getAllOrders(
  page: number = 1,
  limit: number = 20,
  status?: string,
): Promise<{ orders: Order[]; pagination: OrderPagination }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== "all") {
    params.set("status", status);
  }
  const data = await apiClient.request(`/orders?${params.toString()}`);
  if (!Array.isArray(data?.orders)) {
    throw new Error("Orders response is missing the order list.");
  }

  const total = Number(data.pagination?.total);
  const responseLimit = Number(data.pagination?.limit);
  const responsePage = Number(data.pagination?.page);
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    !Number.isInteger(responseLimit) ||
    responseLimit < 1 ||
    !Number.isInteger(responsePage) ||
    responsePage < 1
  ) {
    throw new Error("Orders response is missing valid pagination metadata.");
  }

  return {
    orders: data.orders,
    pagination: {
      page: responsePage,
      limit: responseLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / responseLimit),
    },
  };
}

export async function getOrderById(orderId: string): Promise<Order> {
  return apiClient.request(`/orders/${encodeURIComponent(orderId)}`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  return apiClient.request(`/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function confirmPayment(
  orderId: string,
): Promise<{ orderId: string; payment: Payment }> {
  const response = await apiClient.request(`/orders/${orderId}/payment/confirm`, {
    method: "PUT",
  });
  // Return an object that includes the orderId
  return { orderId, payment: response };
}
