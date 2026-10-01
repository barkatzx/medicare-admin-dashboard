import { apiClient } from "../client";
import type { Order, Payment } from "./orders.types";

export async function getAllOrders(
  page: number = 1,
  limit: number = 20,
  status?: string,
): Promise<{ orders: Order[]; pagination: any }> {
  let url = `/orders?page=${page}&limit=${limit}`;
  if (status && status !== "all") {
    url += `&status=${status}`;
  }
  const data = await apiClient.request(url);
  return {
    orders: data?.orders || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getOrderById(orderId: string): Promise<Order> {
  return apiClient.request(`/orders/${orderId}`);
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
