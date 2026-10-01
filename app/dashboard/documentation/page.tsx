// src/app/dashboard/documentation/page.tsx
"use client";

import {
  BarChart3,
  BookOpen,
  Check,
  Code,
  Copy,
  Database,
  ExternalLink,
  Github,
  Key,
  Linkedin,
  Lock,
  Mail,
  Package,
  Search,
  Server,
  Shield,
  ShoppingCart,
  Twitter,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  description: string;
  auth: "public" | "customer" | "admin";
  body?: any;
}

const customerRoutes: ApiEndpoint[] = [
  // Authentication
  {
    method: "POST",
    endpoint: "/users/register",
    description: "Register a new user account",
    auth: "public",
  },
  {
    method: "POST",
    endpoint: "/users/login",
    description: "Login to user account",
    auth: "public",
  },
  // Profile Management
  {
    method: "GET",
    endpoint: "/users/profile",
    description: "Get user profile information",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/profile",
    description: "Update user profile",
    auth: "customer",
  },
  {
    method: "POST",
    endpoint: "/users/change-password",
    description: "Change user password",
    auth: "customer",
  },
  // Address Management
  {
    method: "GET",
    endpoint: "/users/addresses",
    description: "Get all user addresses",
    auth: "customer",
  },
  {
    method: "POST",
    endpoint: "/users/addresses",
    description: "Add new address",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/addresses/:addressId",
    description: "Update address",
    auth: "customer",
  },
  {
    method: "DELETE",
    endpoint: "/users/addresses/:addressId",
    description: "Delete address",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/addresses/:addressId/default",
    description: "Set default address",
    auth: "customer",
  },
  // Cart Management
  {
    method: "GET",
    endpoint: "/users/cart",
    description: "Get user cart",
    auth: "customer",
  },
  {
    method: "GET",
    endpoint: "/users/cart/count",
    description: "Get cart item count",
    auth: "customer",
  },
  {
    method: "POST",
    endpoint: "/users/cart/add",
    description: "Add item to cart",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/cart/item/:itemId",
    description: "Update cart item",
    auth: "customer",
  },
  {
    method: "DELETE",
    endpoint: "/users/cart/item/:itemId",
    description: "Remove cart item",
    auth: "customer",
  },
  {
    method: "DELETE",
    endpoint: "/users/cart/clear",
    description: "Clear cart",
    auth: "customer",
  },
  // Notifications
  {
    method: "GET",
    endpoint: "/users/notifications",
    description: "Get user notifications",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/notifications/read-all",
    description: "Mark all notifications as read",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/users/notifications/:notificationId/read",
    description: "Mark notification as read",
    auth: "customer",
  },
  // Products (Public)
  {
    method: "GET",
    endpoint: "/products",
    description: "Get all products",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/products/search",
    description: "Search products",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/products/:id",
    description: "Get product by ID",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/products/trending",
    description: "Get trending products",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/products/featured",
    description: "Get featured products",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/products/new",
    description: "Get new products",
    auth: "public",
  },
  // Categories (Public)
  {
    method: "GET",
    endpoint: "/categories",
    description: "Get all categories",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/categories/:id",
    description: "Get category by ID",
    auth: "public",
  },
  {
    method: "GET",
    endpoint: "/categories/:id/products",
    description: "Get products by category",
    auth: "public",
  },
  // Orders (Customer)
  {
    method: "POST",
    endpoint: "/orders",
    description: "Create new order",
    auth: "customer",
  },
  {
    method: "GET",
    endpoint: "/orders/my-orders",
    description: "Get my orders",
    auth: "customer",
  },
  {
    method: "GET",
    endpoint: "/orders/my-orders/:orderId",
    description: "Get order by ID",
    auth: "customer",
  },
  {
    method: "PUT",
    endpoint: "/orders/:orderId/cancel",
    description: "Cancel order",
    auth: "customer",
  },
];

const adminRoutes: ApiEndpoint[] = [
  // User Management
  {
    method: "GET",
    endpoint: "/users/all",
    description: "Get all users",
    auth: "admin",
  },
  {
    method: "PUT",
    endpoint: "/users/approve/:userId",
    description: "Approve user",
    auth: "admin",
  },
  {
    method: "POST",
    endpoint: "/users/notifications/send",
    description: "Send notification to user",
    auth: "admin",
  },
  {
    method: "POST",
    endpoint: "/users/notifications/send-bulk",
    description: "Send bulk notifications",
    auth: "admin",
  },
  // Product Management
  {
    method: "GET",
    endpoint: "/products/admin/low-stock",
    description: "Get low stock products",
    auth: "admin",
  },
  {
    method: "POST",
    endpoint: "/products",
    description: "Create new product",
    auth: "admin",
  },
  {
    method: "PUT",
    endpoint: "/products/:id",
    description: "Update product",
    auth: "admin",
  },
  {
    method: "DELETE",
    endpoint: "/products/:id",
    description: "Delete product",
    auth: "admin",
  },
  {
    method: "POST",
    endpoint: "/products/:id/images",
    description: "Add product images",
    auth: "admin",
  },
  {
    method: "DELETE",
    endpoint: "/products/:productId/images/:imageId",
    description: "Delete product image",
    auth: "admin",
  },
  {
    method: "PATCH",
    endpoint: "/products/:id/stock",
    description: "Update product stock",
    auth: "admin",
  },
  {
    method: "PATCH",
    endpoint: "/products/{{productId}}/trending",
    description: "Update product trending status",
    auth: "admin",
  },
  {
    method: "PATCH",
    endpoint: "/products/{{productId}}/featured",
    description: "Update product featured status",
    auth: "admin",
  },
  // Category Management
  {
    method: "POST",
    endpoint: "/categories",
    description: "Create category",
    auth: "admin",
  },
  {
    method: "PUT",
    endpoint: "/categories/:id",
    description: "Update category",
    auth: "admin",
  },
  {
    method: "DELETE",
    endpoint: "/categories/:id",
    description: "Delete category",
    auth: "admin",
  },
  // Order Management
  {
    method: "GET",
    endpoint: "/orders",
    description: "Get all orders",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/orders/:orderId",
    description: "Get order by ID",
    auth: "admin",
  },
  {
    method: "PUT",
    endpoint: "/orders/:orderId/status",
    description: "Update order status",
    auth: "admin",
  },
  {
    method: "PUT",
    endpoint: "/orders/:orderId/payment/confirm",
    description: "Confirm payment",
    auth: "admin",
  },
  // Sales & Reports
  {
    method: "GET",
    endpoint: "/sales/daily",
    description: "Get daily sales",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/weekly",
    description: "Get weekly sales",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/monthly",
    description: "Get monthly sales",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/yearly",
    description: "Get yearly sales",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/summary",
    description: "Get sales summary",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/custom-range",
    description: "Get custom range sales",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/top-products",
    description: "Get top selling products",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/export",
    description: "Export sales data",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/dashboard",
    description: "Get dashboard data",
    auth: "admin",
  },
  {
    method: "GET",
    endpoint: "/sales/today-ordered-products",
    description: "Get today's ordered products",
    auth: "admin",
  },
];

const baseUrl = "https://medicare-server-9je0.onrender.com/v1";

export default function DocumentationPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(`${baseUrl}${text}`);
    setCopiedEndpoint(text);
    toast.success("Endpoint copied to clipboard!");
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const filteredCustomerRoutes = customerRoutes.filter(
    (route) =>
      route.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredAdminRoutes = adminRoutes.filter(
    (route) =>
      route.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-700 border-green-200";
      case "POST":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PUT":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "PATCH":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
              <BookOpen size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
          </div>
          <p className="text-gray-300 max-w-2xl">
            Complete API reference for the Medicare Admin Dashboard. All
            endpoints are documented with their request methods, authentication
            requirements, and expected responses.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">
                API Status: Operational
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-blue-400" />
              <span className="text-xs text-gray-400">
                JWT Authentication Required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Server size={12} className="text-purple-400" />
              <span className="text-xs text-gray-400">RESTful API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Base URL Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server size={18} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Base URL</h2>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <code className="text-sm font-mono text-gray-300">{baseUrl}</code>
          <button
            onClick={() => handleCopy("")}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {copiedEndpoint === "" ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          All API requests should be made to this base URL followed by the
          endpoint path.
        </p>
      </div>

      {/* Authentication Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Key size={18} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Authentication
          </h2>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-amber-800 mb-3">
            Protected routes require a valid JWT token in the Authorization
            header:
          </p>
          <div className="bg-gray-900 rounded-xl p-3">
            <code className="text-xs font-mono text-gray-300">
              Authorization: Bearer &lt;your_jwt_token&gt;
            </code>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <Shield size={12} />
            <span>
              Tokens expire after 365 days. Use the login endpoint to obtain a
              new token.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("customer")}
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === "customer"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Customer Routes
          </div>
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === "admin"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} />
            Admin Routes
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search endpoints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {/* Endpoints Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Code size={16} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "customer"
                ? "Customer Endpoints"
                : "Admin Endpoints"}
            </h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full ml-2">
              {activeTab === "customer"
                ? filteredCustomerRoutes.length
                : filteredAdminRoutes.length}{" "}
              endpoints
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Auth
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Copy
                </th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "customer"
                ? filteredCustomerRoutes
                : filteredAdminRoutes
              ).map((route, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                >
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${getMethodColor(route.method)}`}
                    >
                      {route.method}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <code className="text-xs font-mono text-gray-900">
                      {route.endpoint}
                    </code>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-600">
                    {route.description}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        route.auth === "public"
                          ? "bg-gray-100 text-gray-600"
                          : route.auth === "customer"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {route.auth === "public" ? (
                        <Globe size={10} />
                      ) : route.auth === "customer" ? (
                        <User size={10} />
                      ) : (
                        <Shield size={10} />
                      )}
                      {route.auth === "public"
                        ? "Public"
                        : route.auth === "customer"
                          ? "Customer"
                          : "Admin"}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => handleCopy(route.endpoint)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {copiedEndpoint === route.endpoint ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(activeTab === "customer"
          ? filteredCustomerRoutes
          : filteredAdminRoutes
        ).length === 0 && (
          <div className="text-center py-12">
            <Search size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No endpoints found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Customer Endpoints</p>
              <p className="text-2xl font-bold text-blue-700">
                {customerRoutes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Admin Endpoints</p>
              <p className="text-2xl font-bold text-purple-700">
                {adminRoutes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Database size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Resources</p>
              <p className="text-2xl font-bold text-emerald-700">
                {customerRoutes.length + adminRoutes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Lock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Protected Routes</p>
              <p className="text-2xl font-bold text-orange-700">
                {customerRoutes.filter((r) => r.auth !== "public").length +
                  adminRoutes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Categories Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Users size={24} className="mx-auto mb-2 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            User Management
          </h4>
          <p className="text-xs text-gray-500 mt-1">6 endpoints</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Package size={24} className="mx-auto mb-2 text-green-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Product Management
          </h4>
          <p className="text-xs text-gray-500 mt-1">9 endpoints</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <ShoppingCart size={24} className="mx-auto mb-2 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Order Management
          </h4>
          <p className="text-xs text-gray-500 mt-1">8 endpoints</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <BarChart3 size={24} className="mx-auto mb-2 text-orange-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Sales & Reports
          </h4>
          <p className="text-xs text-gray-500 mt-1">11 endpoints</p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <p className="text-sm text-gray-300">
              Built with precision by{" "}
              <a
                href="https://www.qodeax.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1"
              >
                Qodeax – Software Agency
                <ExternalLink size={12} />
              </a>
            </p>
          </div>
          <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
            Qodeax specializes in building high-performance web applications,
            scalable backend systems, and developer-first tools. This admin
            panel is engineered for clarity, performance, and complete API
            controllability.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a
              href="#"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Github size={16} />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Twitter size={16} />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Mail size={16} />
            </a>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-[10px] text-gray-500">
              © 2024 MediCare. All rights reserved. | Version 1.0.0
            </p>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 pt-4">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

// Helper component for Globe icon (not in lucide-react by default)
const Globe = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
