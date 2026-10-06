"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  KeyRound,
  Lock,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AccessLevel = "Public" | "Customer" | "Admin" | "TSR";
type Endpoint = {
  method: HttpMethod;
  path: string;
  summary: string;
  access: AccessLevel;
  details: string[];
  body?: string;
  response?: string;
};
type ApiGroup = {
  id: string;
  title: string;
  description: string;
  endpoints: Endpoint[];
};

const baseUrl = "https://medicare-server-9je0.onrender.com";

// ── helpers (keep the data below short and readable) ──────────────────────
const ep = (
  method: HttpMethod,
  path: string,
  access: AccessLevel,
  summary: string,
  details: string[] = [],
  body?: string,
  response?: string,
): Endpoint => ({ method, path, access, summary, details, body, response });

const APPROVED =
  "Access: Authenticated, approved user; admin is allowed even if unapproved.";
const ADMIN_ONLY =
  "Access: Admin only. Valid bearer JWT and role admin required.";
const NONE = "No query parameters, path parameters, or request body.";
const PG = `"pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0, "hasNextPage": false, "hasPrevPage": false }`;
const MSG = (m: string) => `{\n  "message": "${m}"\n}`;
const OK = (m: string, data?: string) =>
  `{\n  "success": true,${data ? `\n  "data": ${data},` : ""}\n  "message": "${m}"\n}`;
const LIST = (key: string) =>
  `{\n  "success": true,\n  "data": {\n    "${key}": [],\n    ${PG}\n  }\n}`;
const ID = `{ "id": "...", "name": "..." }`;
const TSR_STATUS = `{\n  "status": "confirmed | processing | shipped | delivered | cancelled"\n}`;
const TSR_SALES = (
  path: string,
  summary: string,
  details: string[],
  response: string,
) =>
  ep(
    "GET",
    path,
    "Admin",
    summary,
    [`Also available at /v1${path}.`, ...details],
    undefined,
    response,
  );

const apiGroups: ApiGroup[] = [
  {
    id: "overview",
    title: "Overview",
    description:
      "Base platform behavior, security model, versioning rules, and rate limits.",
    endpoints: [
      ep(
        "GET",
        "/",
        "Public",
        "Health check endpoint for service availability.",
        [
          "No API version is inferred for the health check: its path is /.",
          "The handler does not read a request body or query parameters.",
        ],
        undefined,
        `{\n  "status": "OK",\n  "message": "Server is running"\n}`,
      ),
      ep(
        "GET",
        "/v1/*",
        "Public",
        "Version prefix conventions and shared authentication rules.",
        [
          "The server uses the /v1 prefix for versioned routes, except the health check and one mount of the admin TSR-sales router.",
          "Authentication uses Authorization: Bearer <JWT>. Successful login issues a JWT that expires in 30 days.",
          "authenticateToken rejects missing tokens with 401, blacklisted tokens with 401, and invalid or expired tokens with 403.",
          "authorizeApproved requires isApproved: true, except that it also permits users whose JWT role is admin. authorizeAdmin checks only for role admin.",
          "TSR routes check for role TSR but do not use authorizeApproved. TSR order data is limited by the TSR user's division, district, and upazila.",
          "Public routes do not require authentication. Role names are case-sensitive (admin, customer, TSR).",
          "Registration is limited to 5 attempts per IP per 15 minutes; login is limited to 10 attempts per IP per 5 minutes.",
        ],
      ),
    ],
  },
  {
    id: "auth",
    title: "Authentication",
    description:
      "Self-registration, sign-in, logout, and token handling rules.",
    endpoints: [
      ep(
        "POST",
        "/v1/users/register",
        "Public",
        "Self-register a customer account. New accounts are unapproved and cannot log in until approved by an admin.",
        [
          "Access: Public; no authentication. No query or path parameters.",
          "The validator requires valid email/mobile phone, password length >= 6, and allows only customer as the optional role.",
          "Registration attempts are rate-limited to 5 per IP per 15 minutes.",
          "A cart is created during registration.",
          "Response 201 includes selected user fields (id, email, phone_number, name, pharmacy_name, role, isApproved, address/location IDs, createdAt); no password is returned.",
        ],
        `{
  "email": "customer@example.com",
  "phone_number": "+15555550100",
  "password": "string (minimum 6 characters)",
  "name": "optional string",
  "pharmacy_name": "optional string",
  "fullAddress": "optional string",
  "divisionId": "optional UUID",
  "districtId": "optional UUID",
  "upazilaId": "optional UUID",
  "role": "optional; only customer"
}`,
        `{
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "phone_number": "...", "name": "...", "pharmacy_name": "...", "role": "customer", "isApproved": false },
    "message": "Registration successful. Please wait for admin approval."
  }
}`,
      ),
      ep(
        "POST",
        "/v1/users/login",
        "Public",
        "Authenticate an approved user by email or phone number.",
        [
          "Access: Public; no authentication.",
          "At least one of email or phone_number and a non-empty password are required.",
          "Login rejects unapproved accounts.",
          "Attempts are rate-limited to 10 per IP per 5 minutes.",
          "Successful login returns a JWT valid for 30 days.",
        ],
        `{\n  "email": "optional email",\n  "phone_number": "optional mobile number",\n  "password": "string"\n}`,
        `{
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "phone_number": "...", "role": "...", "isApproved": true, "name": "...", "pharmacy_name": "..." },
    "token": "...",
    "message": "Login successful"
  }
}`,
      ),
      ep(
        "POST",
        "/v1/users/logout",
        "Customer",
        "Revoke the bearer token by placing it on the Redis blacklist.",
        [
          "Access: Authenticated user; any role.",
          "Valid bearer JWT required. The token is blacklisted for 24 hours.",
          "No query parameters, path parameters, or request body.",
        ],
        undefined,
        MSG("Logged out successfully"),
      ),
    ],
  },
  {
    id: "profile",
    title: "User profile",
    description:
      "Current-user data access, profile updates, and password changes.",
    endpoints: [
      ep(
        "GET",
        "/v1/users/profile",
        "Customer",
        "Get the current user's profile, location relations, saved addresses, and up to 10 unread notifications.",
        [
          APPROVED,
          "User identity comes from the JWT; users cannot request another user's profile.",
          "No query parameters, path parameters, or request body.",
        ],
        undefined,
        `{
  "message": "Profile fetched successfully",
  "data": {
    "id": "...",
    "email": "...",
    "division": { "id": "..." },
    "district": { "id": "..." },
    "upazila": { "id": "..." },
    "addresses": [],
    "notifications": []
  }
}`,
      ),
      ep(
        "PUT",
        "/v1/users/profile",
        "Customer",
        "Update recognized fields on the current user's profile.",
        [
          APPROVED,
          "Unrecognized fields are not used by the handler.",
          "Updates only the authenticated user's profile. The route invalidates the profile cache.",
        ],
        `{
  "name": "optional string",
  "pharmacy_name": "optional string",
  "phone_number": "optional mobile number",
  "fullAddress": "optional string",
  "divisionId": "optional UUID",
  "districtId": "optional UUID",
  "upazilaId": "optional UUID"
}`,
        `{
  "message": "Profile updated successfully",
  "data": { "id": "...", "email": "...", "name": "...", "pharmacy_name": "...", "role": "...", "isApproved": true, "divisionId": "...", "districtId": "...", "upazilaId": "..." }
}`,
      ),
      ep(
        "POST",
        "/v1/users/change-password",
        "Customer",
        "Change the current user's password after verifying the existing password.",
        [
          APPROVED,
          "Only the authenticated user's password can be changed.",
          "The handler requires both fields; no additional new-password length rule is applied here.",
        ],
        `{\n  "oldPassword": "string",\n  "newPassword": "string"\n}`,
        MSG("Password changed successfully"),
      ),
    ],
  },
  {
    id: "addresses",
    title: "Addresses",
    description: "Saved shipping addresses for the authenticated user.",
    endpoints: [
      ep(
        "GET",
        "/v1/users/addresses",
        "Customer",
        "List the authenticated user's addresses, newest first.",
        [
          APPROVED,
          "Only addresses owned by the authenticated user are returned.",
        ],
        undefined,
        `{
  "message": "Addresses fetched successfully",
  "data": [
    { "id": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "country": "...", "isDefault": true }
  ]
}`,
      ),
      ep(
        "POST",
        "/v1/users/addresses",
        "Customer",
        "Add an address. The first address becomes default automatically; setting isDefault: true makes it the default.",
        [
          APPROVED,
          "Address is attached to the authenticated user.",
          "Related address and profile caches are invalidated.",
        ],
        `{
  "street": "string (required)",
  "city": "string (required)",
  "state": "optional string",
  "postalCode": "optional string",
  "country": "string (required)",
  "isDefault": "optional boolean"
}`,
        `{\n  "message": "Address added successfully",\n  "data": { "id": "...", "street": "...", "city": "...", "country": "...", "isDefault": true }\n}`,
      ),
      ep(
        "PUT",
        "/v1/users/addresses/:addressId",
        "Customer",
        "Update an address owned by the authenticated user.",
        [
          APPROVED,
          "An address belonging to another user is treated as not found.",
          "If the default is unset, the oldest remaining address is made default when one exists.",
        ],
        `{
  "street": "optional string",
  "city": "optional string",
  "state": "optional string",
  "postalCode": "optional string",
  "country": "optional string",
  "isDefault": "optional boolean"
}`,
        `{\n  "message": "Address updated successfully",\n  "data": { "id": "...", "isDefault": false }\n}`,
      ),
      ep(
        "PUT",
        "/v1/users/addresses/:addressId/default",
        "Customer",
        "Make the specified owned address the user's default address.",
        [
          APPROVED,
          "Address must belong to the authenticated user.",
          "No query parameters or request body.",
        ],
        undefined,
        `{\n  "message": "Default address set successfully",\n  "data": { "id": "...", "isDefault": true }\n}`,
      ),
      ep(
        "DELETE",
        "/v1/users/addresses/:addressId",
        "Customer",
        "Delete an owned address.",
        [
          APPROVED,
          "Address must belong to the authenticated user.",
          "Deletion is rejected with 400 if an order uses the address.",
          "When deleting the default, the oldest remaining address becomes default.",
        ],
        undefined,
        MSG("Address deleted successfully"),
      ),
    ],
  },
  {
    id: "admin-users",
    title: "User & admin management",
    description:
      "Admin-only user listing, approval, role promotion, and deletion.",
    endpoints: [
      ep(
        "GET",
        "/v1/users/all",
        "Admin",
        "List users, optionally filtering by role and approval state.",
        [
          "Access: Admin only.",
          "Query parameters: page (default 1), limit (default 20), role (admin, customer, or TSR), isApproved (true selects approved; any other supplied value selects unapproved).",
          "Passwords are not selected. Invalid role returns 400.",
        ],
        undefined,
        `{
  "message": "Users fetched successfully",
  "data": {
    "users": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0, "hasNextPage": false, "hasPrevPage": false }
  }
}`,
      ),
      ep(
        "PUT",
        "/v1/users/approve/:userId",
        "Admin",
        "Approve a user and create an approval notification for them.",
        [
          "Access: Admin only.",
          "Already-approved user returns 400. Unknown user returns 404.",
          "No query parameters or request body.",
        ],
        undefined,
        `{\n  "message": "User approved successfully",\n  "data": { "id": "...", "email": "...", "name": "...", "role": "...", "isApproved": true }\n}`,
      ),
      ep(
        "PATCH",
        "/v1/users/:userId/role",
        "Admin",
        "Promote a customer to TSR.",
        [
          "Access: Admin only.",
          "Only a current customer can be promoted.",
          "Invalid role returns 400; a non-customer returns 409; a missing user returns 404.",
        ],
        `{\n  "role": "TSR"\n}`,
        `{\n  "message": "User promoted to TSR successfully",\n  "data": { "id": "...", "email": "...", "name": "...", "role": "TSR", "isApproved": true, "createdAt": "..." }\n}`,
      ),
      ep(
        "DELETE",
        "/v1/users/:userId",
        "Admin",
        "Delete the specified user profile.",
        ["Access: Admin only.", "No query parameters or request body."],
        undefined,
        MSG("User profile deleted successfully"),
      ),
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Per-user notification reads, mark-as-read, and admin send operations.",
    endpoints: [
      ep(
        "GET",
        "/v1/users/notifications",
        "Customer",
        "List the authenticated user's notifications and unread count.",
        [
          APPROVED,
          "Query parameters: unreadOnly=true filters the list to unread items; page (default 1); limit (default 20).",
          "Only the authenticated user's notifications are returned.",
        ],
        undefined,
        `{
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [],
    "unreadCount": 0,
    "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
  }
}`,
      ),
      ep(
        "PUT",
        "/v1/users/notifications/:notificationId",
        "Customer",
        "Mark one of the current user's notifications as read.",
        [APPROVED, "Notification must belong to the authenticated user."],
        undefined,
        `{\n  "message": "Notification marked as read",\n  "data": { "id": "...", "isRead": true }\n}`,
      ),
      ep(
        "PUT",
        "/v1/users/notifications/read-all",
        "Customer",
        "Mark all of the current user's unread notifications as read.",
        [APPROVED, "Affects only the authenticated user's notifications."],
        undefined,
        `{\n  "message": "All notifications marked as read",\n  "data": { "count": 0 }\n}`,
      ),
      ep(
        "POST",
        "/v1/users/notifications/send",
        "Admin",
        "Create a notification for one user.",
        ["Access: Admin only.", "userId must identify an existing user."],
        `{\n  "userId": "string",\n  "title": "string",\n  "message": "string",\n  "type": "order | approval | system"\n}`,
        `{\n  "message": "Notification sent successfully",\n  "data": { "id": "...", "title": "...", "type": "system" }\n}`,
      ),
      ep(
        "POST",
        "/v1/users/notifications/send-bulk",
        "Admin",
        "Create the same notification for each listed user.",
        [
          "Access: Admin only.",
          "userIds must be a non-empty array and every ID must exist.",
        ],
        `{\n  "userIds": ["string"],\n  "title": "string",\n  "message": "string",\n  "type": "order | approval | system"\n}`,
        `{\n  "message": "Notifications sent to N users successfully",\n  "data": { "count": 0, "notifications": [] }\n}`,
      ),
    ],
  },
  {
    id: "cart",
    title: "Cart",
    description:
      "Cart retrieval, item updates, and order preparation. All cart endpoints use the current user's cart and require authenticateToken plus authorizeApproved (admin bypasses approval). Cart mutations invalidate the cart cache.",
    endpoints: [
      ep(
        "GET",
        "/v1/users/cart",
        "Customer",
        "Get cart items and calculated subtotal, savings, total, and quantity count.",
        [
          APPROVED,
          "Only the authenticated user's cart is returned.",
          "Empty carts return an empty items array and zero totals.",
        ],
        undefined,
        `{
  "success": true,
  "data": {
    "items": [{ "id": "...", "quantity": 1, "product": { "finalPrice": 0, "discountPercent": 0 }, "itemTotal": 0, "itemSavings": 0 }],
    "subtotal": 0,
    "totalSavings": 0,
    "total": 0,
    "itemCount": 0
  }
}`,
      ),
      ep(
        "GET",
        "/v1/users/cart/count",
        "Customer",
        "Get the sum of quantities in the current user's cart.",
        ["Only the authenticated user's cart is counted."],
        undefined,
        `{\n  "success": true,\n  "message": "Cart item count fetched successfully",\n  "data": { "count": 0 }\n}`,
      ),
      ep(
        "POST",
        "/v1/users/cart/add",
        "Customer",
        "Add a product quantity to the cart, incrementing an existing matching cart item.",
        [
          "Uses only the authenticated user's cart.",
          "Returns 404 for an unknown product and 400 for invalid quantity or insufficient stock.",
          "quantity must be at least 1.",
        ],
        `{\n  "productId": "string",\n  "quantity": 1\n}`,
        OK("Product added to cart successfully"),
      ),
      ep(
        "PUT",
        "/v1/users/cart/item/:itemId",
        "Customer",
        "Set a cart item's quantity.",
        [
          "The item must belong to the authenticated user's cart.",
          "quantity cannot exceed current product stock.",
          "quantity must be at least 1.",
        ],
        `{\n  "quantity": 1\n}`,
        `{\n  "success": true,\n  "message": "Cart item updated successfully",\n  "data": { "id": "...", "quantity": 1, "productId": "..." }\n}`,
      ),
      ep(
        "DELETE",
        "/v1/users/cart/item/:itemId",
        "Customer",
        "Remove one item from the current user's cart.",
        ["The item must belong to the authenticated user's cart."],
        undefined,
        OK("Item removed from cart successfully"),
      ),
      ep(
        "DELETE",
        "/v1/users/cart/clear",
        "Customer",
        "Remove all items from the current user's cart.",
        ["Affects only the authenticated user's cart."],
        undefined,
        OK("Cart cleared successfully (N items removed)"),
      ),
    ],
  },
  {
    id: "products",
    title: "Products",
    description:
      "Public product browsing, search, and admin inventory management.",
    endpoints: [
      ep(
        "GET",
        "/v1/products",
        "Public",
        "List products with optional filters, sorting, and pagination. Includes image, category, distributor name, and computed price/discount fields.",
        [
          "Query parameters: page (default 1); limit (default 20); categoryId; minPrice; maxPrice; onSale=true; inStock=true; sortBy (default createdAt); sortOrder (default desc).",
          "The supplied sort field/order are passed to Prisma without an endpoint allowlist.",
          "The default list does not exclude out-of-stock products unless inStock=true.",
        ],
        undefined,
        `{
  "success": true,
  "data": {
    "products": [{ "id": "...", "price": 0, "discountedPrice": null, "finalPrice": 0, "savings": 0, "discountBadge": "...", "discountPercent": 0, "distributor": "...", "distributorId": "...", "tp": null, "images": [], "category": {} }],
    ${PG}
  }
}`,
      ),
      ep(
        "GET",
        "/v1/products/:id",
        "Public",
        "Fetch one product with images, category, distributor name, and computed discount fields.",
        ["Unknown product returns 404."],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "finalPrice": 0, "savings": 0, "discountBadge": "...", "discountPercent": 0, "images": [], "category": {}, "distributor": "..." }\n}`,
      ),
      ep(
        "GET",
        "/v1/products/search",
        "Public",
        "Search in-stock products by case-insensitive name or description.",
        [
          "Query parameters: q (required); page (default 1); limit (default 20).",
          "Missing/non-string q returns 400.",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "products": [],\n    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
      ep(
        "GET",
        "/v1/products/trending",
        "Public",
        "List trending, in-stock products, newest first.",
        ["Query parameters: page (default 1; fixed page size 20)."],
        undefined,
        LIST("products"),
      ),
      ep(
        "GET",
        "/v1/products/featured",
        "Public",
        "List featured, in-stock products, newest first.",
        [
          "Query parameters: page (default 1; fixed page size 20).",
          "Same envelope and product fields as GET /v1/products/trending.",
        ],
        undefined,
        LIST("products"),
      ),
      ep(
        "GET",
        "/v1/products/new",
        "Public",
        "List in-stock products created during the last 15 days.",
        ["Query parameters: page (default 1); limit (default 20)."],
        undefined,
        LIST("products"),
      ),
      ep(
        "GET",
        "/v1/products/admin/low-stock",
        "Admin",
        "List products with stock from 1 through 20, ordered by stock ascending.",
        [
          "Query parameters: page (default 1); limit (default 20, capped at 20; invalid/non-positive values use 20).",
          ADMIN_ONLY,
        ],
        undefined,
        LIST("products"),
      ),
      ep(
        "GET",
        "/v1/products/admin/out-of-stock",
        "Admin",
        "List products with stock exactly zero.",
        [
          "Query parameters: page (default 1); limit (default 20, capped at 20).",
          ADMIN_ONLY,
        ],
        undefined,
        LIST("products"),
      ),
      ep(
        "POST",
        "/v1/products",
        "Admin",
        "Create a product, optionally uploading product images.",
        [
          "Request body: multipart/form-data.",
          "Required fields: name, description, price (> 0), categoryId.",
          "Optional fields: discountedPrice, discountPercent, stock (defaults to 0), tp, and either distributorId or distributor (name, not both).",
          "Image files use field name images (up to 10 files, max 5 MB each; JPEG, JPG, PNG, GIF, WebP).",
        ],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "price": 0, "discountedPrice": null, "finalPrice": 0, "savings": 0, "images": [], "category": {}, "distributor": "...", "tp": null },\n  "message": "Product created successfully"\n}`,
      ),
      ep(
        "PUT",
        "/v1/products/:id",
        "Admin",
        "Update recognized product fields and optionally append uploaded images.",
        [
          "Request body: multipart/form-data.",
          "Optional fields: name, description, price, discountedPrice, discountPercent, stock, categoryId, tp, and either distributorId or distributor (not both).",
          "Image files use images (same upload restrictions as product creation).",
        ],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "price": 0, "finalPrice": 0, "images": [], "category": {}, "distributor": "...", "tp": null },\n  "message": "Product updated successfully"\n}`,
      ),
      ep(
        "DELETE",
        "/v1/products/:id",
        "Admin",
        "Delete a product and its database image records.",
        [
          "Deletion is rejected if the product appears in existing order items.",
        ],
        undefined,
        OK("Product deleted successfully"),
      ),
      ep(
        "PATCH",
        "/v1/products/:id/stock",
        "Admin",
        "Set stock directly or increment/decrement the current stock.",
        [
          "If operation is omitted or has another value, stock is assigned directly.",
          "A decrement below zero returns 400.",
        ],
        `{\n  "stock": 5,\n  "operation": "increment | decrement"\n}`,
        `{\n  "success": true,\n  "data": { "id": "...", "stock": 0, "distributor": "...", "tp": null },\n  "message": "Stock updated successfully"\n}`,
      ),
      ep(
        "PATCH",
        "/v1/products/:id/trending",
        "Admin",
        "Set a product's trending flag.",
        ["trending must be boolean."],
        `{\n  "trending": true\n}`,
        OK(
          "Trending status updated successfully",
          `{ "id": "...", "trending": true }`,
        ),
      ),
      ep(
        "PATCH",
        "/v1/products/:id/featured",
        "Admin",
        "Set a product's featured flag.",
        ["featured must be boolean."],
        `{\n  "featured": true\n}`,
        OK(
          "Featured status updated successfully",
          `{ "id": "...", "featured": true }`,
        ),
      ),
      ep(
        "POST",
        "/v1/products/:id/images",
        "Admin",
        "Add images to an existing product; the first image is made default only if the product has no current default image.",
        [
          "Request body: multipart/form-data image files in field images (up to 10 files, max 5 MB each; JPEG/JPG/PNG/GIF/WebP).",
        ],
        undefined,
        OK("Images added successfully", `{ "added": 0 }`),
      ),
      ep(
        "DELETE",
        "/v1/products/:productId/images/:imageId",
        "Admin",
        "Delete a product image and, if it was default, promote another image when available.",
        ["Image must belong to the given product."],
        undefined,
        OK("Image deleted successfully"),
      ),
      ep(
        "PATCH",
        "/v1/products/:productId/images/:imageId/default",
        "Admin",
        "Make one image the default image for its product.",
        ["Image must belong to the given product."],
        undefined,
        OK("Default image set successfully"),
      ),
    ],
  },
  {
    id: "categories",
    title: "Categories",
    description: "Public category reads and admin category management.",
    endpoints: [
      ep(
        "GET",
        "/v1/categories",
        "Public",
        "List categories alphabetically with product counts.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": [{ "id": "...", "name": "...", "_count": { "products": 0 } }]\n}`,
      ),
      ep(
        "GET",
        "/v1/categories/:id",
        "Public",
        "Get a category and up to 20 of its in-stock products, newest first.",
        ["Missing category returns 404."],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "name": "...", "products": [] }\n}`,
      ),
      ep(
        "GET",
        "/v1/categories/:id/products",
        "Public",
        "List in-stock products for one category, newest first.",
        [
          "Query parameters: page (default 1); limit (default 20).",
          "Missing category returns 404.",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "products": [],\n    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
      ep(
        "POST",
        "/v1/categories",
        "Admin",
        "Create a category.",
        ["A missing name or duplicate name returns 400."],
        `{\n  "name": "string (required)",\n  "description": "optional"\n}`,
        OK("Category created successfully", ID),
      ),
      ep(
        "PUT",
        "/v1/categories/:id",
        "Admin",
        "Update category name and/or description.",
        ["Missing category returns 404.", "Duplicate name returns 400."],
        `{\n  "name": "optional string",\n  "description": "optional string"\n}`,
        OK("Category updated successfully", ID),
      ),
      ep(
        "DELETE",
        "/v1/categories/:id",
        "Admin",
        "Delete an empty category.",
        ["Deletion is rejected if the category has products."],
        undefined,
        OK("Category deleted successfully"),
      ),
    ],
  },
  {
    id: "distributors",
    title: "Distributors",
    description:
      "Admin-only distributor management. The currently registered route spelling is dristributors (not distributors).",
    endpoints: [
      ep(
        "GET",
        "/v1/dristributors",
        "Admin",
        "List distributors alphabetically.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": [${ID}]\n}`,
      ),
      ep(
        "POST",
        "/v1/dristributors",
        "Admin",
        "Create a distributor.",
        [
          "The handler rejects any body keys other than name.",
          "Duplicate name returns 409.",
        ],
        `{\n  "name": "non-empty string"\n}`,
        OK("Distributor created successfully", ID),
      ),
      ep(
        "GET",
        "/v1/dristributors/:id",
        "Admin",
        "Get one distributor.",
        ["Missing distributor returns 404."],
        undefined,
        `{\n  "success": true,\n  "data": ${ID}\n}`,
      ),
      ep(
        "GET",
        "/v1/dristributors/:id/products",
        "Admin",
        "List a distributor's products newest first, including pricing/discount calculations.",
        [
          "Query parameters: page (default 1); limit (default 20).",
          "Missing distributor returns 404.",
        ],
        undefined,
        LIST("products"),
      ),
      ep(
        "PATCH",
        "/v1/dristributors/:id",
        "Admin",
        "Rename a distributor.",
        [
          "The handler rejects any body keys other than name.",
          "Duplicate name returns 409; missing distributor returns 404.",
        ],
        `{\n  "name": "non-empty string"\n}`,
        OK("Distributor updated successfully", ID),
      ),
      ep(
        "DELETE",
        "/v1/dristributors/:id",
        "Admin",
        "Delete a distributor without associated products.",
        [
          "Deletion is rejected with 409 if products reference it.",
          "Missing distributor returns 404.",
        ],
        undefined,
        OK("Distributor deleted successfully"),
      ),
    ],
  },
  {
    id: "orders",
    title: "Orders",
    description: "Customer checkout flow and administrator order operations.",
    endpoints: [
      ep(
        "POST",
        "/v1/orders",
        "Customer",
        "Create a pending COD order from the current user's cart, decrement stock, clear the cart, create pending payment, and notify the user.",
        [
          "Requires approved-user access (admin bypasses approval).",
          "The shipping address and cart are scoped to the current user.",
          "Empty cart, unavailable address, or insufficient stock returns an error.",
        ],
        `{\n  "shippingAddressId": "string (required; must belong to current user)",\n  "paymentMethod": "optional; defaults to cod"\n}`,
        `{\n  "success": true,\n  "data": { "id": "...", "status": "pending", "items": [], "payment": {}, "shippingAddress": {} },\n  "message": "Order created successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/orders/my-orders",
        "Customer",
        "List only the current user's orders, newest first.",
        [
          "Query parameters: page (default 1); limit (default 10); status (passed as an order status filter without endpoint validation).",
          "Results are restricted to the authenticated user.",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "orders": [],\n    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
      ep(
        "GET",
        "/v1/orders/my-orders/:orderId",
        "Customer",
        "Get one order belonging to the current user.",
        ["Missing/not-owned order returns 404."],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "items": [], "payment": {}, "shippingAddress": {} }\n}`,
      ),
      ep(
        "PUT",
        "/v1/orders/:orderId/cancel",
        "Customer",
        "Cancel the current user's pending order, restore stock, mark its payment failed, and create a notification.",
        [
          "Order must belong to the current user and have status pending.",
          "Another status returns 400.",
        ],
        undefined,
        OK(
          "Order cancelled successfully",
          `{ "id": "...", "status": "cancelled" }`,
        ),
      ),
      ep(
        "GET",
        "/v1/orders",
        "Admin",
        "List all orders, newest first, with customer, item/product, payment, and shipping-address information.",
        [
          "Query parameters: page (default 1); limit (default 20); status (passed to the database as a status filter without endpoint validation).",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "orders": [],\n    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
      ep(
        "GET",
        "/v1/orders/:orderId",
        "Admin",
        "Get any order with customer, item/product/image, payment, and shipping-address details.",
        ["Missing order returns 404."],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "user": {}, "items": [], "payment": {}, "shippingAddress": {} }\n}`,
      ),
      ep(
        "PUT",
        "/v1/orders/:orderId/status",
        "Admin",
        "Set an order status and notify its customer.",
        [
          "Status values are checked by the handler.",
          "pending is not accepted by this endpoint.",
        ],
        TSR_STATUS,
        OK(
          "Order status updated successfully",
          `{ "id": "...", "status": "shipped" }`,
        ),
      ),
      ep(
        "PUT",
        "/v1/orders/:orderId/payment/confirm",
        "Admin",
        "Mark the order payment as paid and notify the customer.",
        ["Unknown order returns 404.", "Already-paid payment returns 400."],
        undefined,
        OK(
          "Payment confirmed successfully",
          `{ "id": "...", "status": "paid", "paidAt": "..." }`,
        ),
      ),
    ],
  },
  {
    id: "tsr",
    title: "TSR APIs",
    description:
      "All TSR routes are mounted at /v1/tsr. They require a valid bearer JWT and exact role TSR. Unlike approved-user routes, these routes do not check account approval. List, detail, and update operations use only orders belonging to customers whose division, district, and upazila all match the TSR's assigned territory.",
    endpoints: [
      ep(
        "GET",
        "/v1/tsr/orders",
        "TSR",
        "List orders in the authenticated TSR's territory, newest first.",
        [
          "Query parameters: page (default 1); limit (default 20); status (pending, confirmed, processing, shipped, delivered, cancelled); search (order ID, customer name, pharmacy name, or phone); startDate; endDate.",
          "Missing territory returns the same empty list with a no-territory message.",
          "Invalid status returns 400. Date strings are parsed by the service; invalid dates are ignored there.",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "orders": [],\n    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  },\n  "message": "TSR orders retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/tsr/orders/summary",
        "TSR",
        "Count territory orders by status.",
        ["No territory returns zero counts and a no-territory message."],
        undefined,
        `{\n  "success": true,\n  "data": { "totalOrders": 0, "pending": 0, "confirmed": 0, "processing": 0, "shipped": 0, "delivered": 0, "cancelled": 0 },\n  "message": "TSR order summary retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/tsr/orders/:orderId",
        "TSR",
        "Get a territory order with customer/location, products, payment, and shipping details.",
        ["Orders outside territory or unavailable territory return 404."],
        undefined,
        `{\n  "success": true,\n  "data": { "id": "...", "user": {}, "items": [], "payment": {}, "shippingAddress": {} }\n}`,
      ),
      ep(
        "PATCH",
        "/v1/tsr/orders/:orderId/status",
        "TSR",
        "Update status of an order in the TSR's territory and notify its customer.",
        [
          "Order must be in the authenticated TSR's territory.",
          "Invalid status returns 400.",
        ],
        TSR_STATUS,
        OK(
          "Order status updated successfully",
          `{ "id": "...", "status": "shipped" }`,
        ),
      ),
    ],
  },
  {
    id: "admin-tsr-sales",
    title: "Admin TSR-Sales",
    description:
      "The same six admin-only routes are mounted at both prefixes: /admin/tsr-sales and /v1/admin/tsr-sales. Every route requires a valid bearer JWT and exact role admin.",
    endpoints: [
      TSR_SALES(
        "/admin/tsr-sales/summary",
        "Return order totals and sums grouped by status across all orders.",
        [NONE],
        `{\n  "success": true,\n  "data": {\n    "totalOrders": 0,\n    "totalOrderValue": 0,\n    "pending": { "count": 0, "value": 0 },\n    "confirmed": { "count": 0, "value": 0 },\n    "delivered": { "count": 0, "value": 0 },\n    "cancelled": { "count": 0, "value": 0 }\n  }\n}`,
      ),
      TSR_SALES(
        "/admin/tsr-sales/allsummary",
        "Return today, weekly, monthly, and yearly order/value summaries and TSR breakdowns/best performers.",
        [
          "Optional query parameter tsrId (UUID). When supplied, the summary is limited to that TSR; invalid ID returns 400, unknown TSR returns 404.",
        ],
        `{\n  "success": true,\n  "data": {\n    "today": { "totalOrders": 0, "totalOrderValue": 0, "tsrs": [], "bestTsrByOrderCount": {}, "bestTsrByOrderValue": {} },\n    "weekly": {},\n    "monthly": {},\n    "yearly": {}\n  }\n}`,
      ),
      TSR_SALES(
        "/admin/tsr-sales/best-performance",
        "Return best TSR by order count and order value for today, weekly, monthly, and yearly periods.",
        ["A best TSR value can be null if there is no qualifying performer."],
        `{\n  "success": true,\n  "data": {\n    "today": { "bestTsrByOrderCount": {}, "bestTsrByOrderValue": {} },\n    "weekly": {},\n    "monthly": {},\n    "yearly": {}\n  }\n}`,
      ),
      TSR_SALES(
        "/admin/tsr-sales/tsrs",
        "List TSR users with territory and aggregated order totals/statuses for their territories.",
        [NONE],
        `{\n  "success": true,\n  "data": [{ "id": "...", "name": "...", "email": "...", "division": {}, "district": {}, "upazila": {}, "totalOrders": 0, "totalOrderValue": 0 }]\n}`,
      ),
      TSR_SALES(
        "/admin/tsr-sales/tsrs/:tsrId",
        "Get TSR territory details, all-status territory totals, and the latest 20 territory orders.",
        ["Invalid UUID returns 400; unknown/non-TSR ID returns 404."],
        `{\n  "success": true,\n  "data": {\n    "tsr": {},\n    "totalOrders": 0,\n    "totalOrderValue": 0,\n    "territoryOrders": [],\n    "territoryOrdersPagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
      TSR_SALES(
        "/admin/tsr-sales/tsrs/:tsrId/orders",
        "Paginate/search/filter orders in a specified TSR's territory.",
        [
          "Query parameters: page (default 1, positive integer); limit (default 20, range 1–100); status (a database order status); search (order ID, customer name, pharmacy name, or phone); startDate; endDate (end date includes through 23:59:59.999 UTC).",
          "Invalid filters/UUID return 400; unknown/non-TSR ID returns 404.",
        ],
        `{\n  "success": true,\n  "data": {\n    "orders": [],\n    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }\n  }\n}`,
      ),
    ],
  },
  {
    id: "sales",
    title: "Sales reports",
    description:
      "Every sales endpoint requires a valid bearer JWT and exact role admin. These reports have no query or path parameters.",
    endpoints: [
      ep(
        "GET",
        "/v1/sales/daily",
        "Admin",
        "Aggregate all pending and confirmed orders across all dates (despite the route's daily name), including item quantities and calculated discounts.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": { "period": "daily", "totalSales": 0, "totalOrders": 0, "averageOrderValue": 0, "totalItemsSold": 0, "totalDiscounts": 0 },\n  "message": "Daily sales retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/sales/weekly",
        "Admin",
        "Report shipped and delivered orders from the last 7 local calendar days, with daily breakdown and totals.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "daily_breakdown": [],\n    "weekly_totals": { "totalSales": 0, "totalOrders": 0, "totalItemsSold": 0, "averageOrderValue": 0 },\n    "average_daily_sales": 0\n  },\n  "message": "Weekly sales retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/sales/monthly",
        "Admin",
        "Report delivered orders from the last 30 local calendar days, with daily breakdown, totals, and best day.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "daily_breakdown": [],\n    "monthly_totals": { "totalSales": 0, "totalOrders": 0, "totalItemsSold": 0, "averageOrderValue": 0 },\n    "average_daily_sales": 0,\n    "best_day": {}\n  },\n  "message": "Monthly sales retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/sales/yearly",
        "Admin",
        "Report delivered orders over the last 12 rolling months, with monthly breakdown, totals, and best month.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "monthly_breakdown": [],\n    "yearly_totals": { "totalSales": 0, "totalOrders": 0, "totalItemsSold": 0, "averageOrderValue": 0 },\n    "average_monthly_sales": 0,\n    "best_month": {}\n  },\n  "message": "Yearly sales retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/sales/summary",
        "Admin",
        "Return all-time sales summary, sales growth percentages, and totals by order status.",
        [
          NONE,
          "Summary sales totals/customers are based on paid, non-cancelled orders; sales-by-status includes every order status.",
        ],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "overall_summary": { "totalSales": 0, "totalOrders": 0, "averageOrderValue": 0, "totalItemsSold": 0, "totalDiscounts": 0, "totalCustomers": 0, "topProducts": [], "topCategories": [], "topCustomers": [] },\n    "growth_percentage": { "daily": 0, "weekly": 0, "monthly": 0, "yearly": 0 },\n    "sales_by_status": [{ "status": "pending", "totalSales": 0, "totalOrders": 0 }]\n  },\n  "message": "Sales summary retrieved successfully"\n}`,
      ),
      ep(
        "GET",
        "/v1/sales/today-ordered-products",
        "Admin",
        "Group order items by product for all confirmed orders; despite the route name, the query has no date filter.",
        [NONE],
        undefined,
        `{\n  "success": true,\n  "data": {\n    "products": [{ "productName": "...", "distributor": "...", "quantity": 0, "price": 0, "tp": null }],\n    "summary": { "totalProducts": 0, "totalQuantity": 0, "totalRevenue": 0 }\n  },\n  "message": "Ordered products retrieved successfully"\n}`,
      ),
    ],
  },
  {
    id: "locations",
    title: "Locations & route inventory",
    description: "Location API status and route inventory cross-check.",
    endpoints: [
      ep(
        "GET",
        "/v1/locations",
        "Public",
        "There are no separately registered division, district, upazila, or location lookup endpoints in the current application.",
        [
          "Registration/profile payloads accept location IDs, and user/profile/TSR/order responses may include location relations, but no location API route is mounted.",
        ],
      ),
      ep(
        "GET",
        "/v1/route-inventory",
        "Public",
        "Route inventory cross-check reflecting all router modules mounted in src/index.ts.",
        [
          "Mounted modules: users, categories, products, orders, TSR, distributor routes, sales, both admin TSR-sales mount prefixes, and the root health check.",
          "The TSR router is mounted twice at the same /v1/tsr prefix; this does not create additional distinct URLs.",
          "No other API router or location route is registered.",
        ],
      ),
    ],
  },
];

const row = (
  group: string,
  p: boolean,
  c: boolean,
  a: boolean,
  t: boolean,
) => ({ group, public: p, customer: c, admin: a, tsr: t });
const roleMatrix = [
  row("Health GET /", true, true, true, true),
  row("Registration and login", true, true, true, true),
  row("Logout", false, true, true, true),
  row("Public product reads (GET /v1/products...)", true, true, true, true),
  row("Admin product inventory and mutations", false, false, true, false),
  row("Public category reads (GET /v1/categories...)", true, true, true, true),
  row("Category mutations", false, false, true, false),
  row("Distributor APIs (/v1/dristributors...)", false, false, true, false),
  row(
    "User profile, address, notification reads/updates, and cart",
    false,
    true,
    true,
    true,
  ),
  row(
    "Admin user management and notification sending",
    false,
    false,
    true,
    false,
  ),
  row(
    "Customer order creation, history, and cancellation",
    false,
    true,
    true,
    true,
  ),
  row(
    "Admin order listing, status, and payment management",
    false,
    false,
    true,
    false,
  ),
  row("TSR territory order APIs (/v1/tsr...)", false, false, false, true),
  row("Admin TSR-sales APIs (both mount prefixes)", false, false, true, false),
  row("Sales reports (/v1/sales...)", false, false, true, false),
];

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const ACCESS: AccessLevel[] = ["Public", "Customer", "Admin", "TSR"];

const methodTone: Record<HttpMethod, string> = {
  GET: "text-emerald-700 bg-emerald-50",
  POST: "text-sky-700 bg-sky-50",
  PUT: "text-amber-700 bg-amber-50",
  PATCH: "text-violet-700 bg-violet-50",
  DELETE: "text-rose-700 bg-rose-50",
};

const accessTone: Record<AccessLevel, string> = {
  Public: "text-slate-600 bg-slate-100",
  Customer: "text-sky-700 bg-sky-50",
  Admin: "text-violet-700 bg-violet-50",
  TSR: "text-teal-700 bg-teal-50",
};

const steps = [
  ["Register", "POST /v1/users/register creates an unapproved customer."],
  ["Get approved", "An admin calls PUT /v1/users/approve/:userId."],
  ["Log in", "POST /v1/users/login returns a JWT valid for 30 days."],
  ["Call the API", "Send Authorization: Bearer <token> on protected routes."],
];

function toCurl(e: Endpoint) {
  const parts = [`curl -X ${e.method} "${baseUrl}${e.path}"`];
  if (e.access !== "Public") parts.push(`-H "Authorization: Bearer $TOKEN"`);
  if (e.body) {
    parts.push(`-H "Content-Type: application/json"`);
    parts.push(`-d '${e.body.replace(/\s*\n\s*/g, " ")}'`);
  }
  return parts.join(" \\\n  ");
}

function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async (ev) => {
        ev.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          toast.error("Unable to copy.");
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      {done ? "Copied" : label}
    </button>
  );
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-[#0E1B22]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1">
        <span className="text-[11px] font-medium text-slate-400">{title}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-5 text-slate-200">
        {code}
      </pre>
    </div>
  );
}

function Path({ path }: { path: string }) {
  return (
    <code className="font-mono text-[13px] text-slate-900">
      {path.split(/(:\w+)/g).map((seg, i) =>
        seg.startsWith(":") ? (
          <span key={i} className="rounded bg-teal-50 px-1 text-teal-700">
            {seg}
          </span>
        ) : (
          <span key={i}>{seg}</span>
        ),
      )}
    </code>
  );
}

export default function DocumentationPage() {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<HttpMethod | null>(null);
  const [access, setAccess] = useState<AccessLevel | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA"].includes(
        (e.target as HTMLElement).tagName,
      );
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return apiGroups
      .map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((e) => {
          if (method && e.method !== method) return false;
          if (access && e.access !== access) return false;
          const hay =
            `${e.method} ${e.path} ${e.summary} ${e.access} ${e.details.join(" ")} ${g.title}`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        }),
      }))
      .filter((g) => g.endpoints.length > 0);
  }, [query, method, access]);

  const total = groups.reduce((n, g) => n + g.endpoints.length, 0);
  const allTotal = apiGroups.reduce((n, g) => n + g.endpoints.length, 0);
  const keyOf = (gid: string, e: Endpoint) => `${gid}|${e.method}|${e.path}`;
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const filtering = query || method || access;

  return (
    <div className="-m-4 min-h-screen bg-[#F6F8F9] text-slate-800 sm:-m-6">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-2">
            <p className="text-sm font-semibold text-slate-900">Medicare API</p>
            <p className="text-[11px] text-slate-500">
              v1 reference · {allTotal} endpoints
            </p>
          </div>
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by path, action, error code or role…"
              aria-label="Search endpoints"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-400">
                /
              </kbd>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#0E1B22] py-1 pl-3 pr-1">
            <code className="max-w-[260px] truncate font-mono text-[12px] text-slate-200">
              {baseUrl}
            </code>
            <CopyButton value={baseUrl} label="" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[84px] lg:h-[calc(100vh-110px)] lg:overflow-y-auto">
          <div className="mb-5 space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Method
              </p>
              <div className="flex flex-wrap gap-1">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(method === m ? null : m)}
                    aria-pressed={method === m}
                    className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ring-1 ring-inset transition ${
                      method === m
                        ? `${methodTone[m]} ring-current`
                        : "bg-white text-slate-500 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Who can call it
              </p>
              <div className="flex flex-wrap gap-1">
                {ACCESS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAccess(access === a ? null : a)}
                    aria-pressed={access === a}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset transition ${
                      access === a
                        ? `${accessTone[a]} ring-current`
                        : "bg-white text-slate-500 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <nav aria-label="Sections" className="border-l border-slate-200">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="-ml-px flex items-center justify-between border-l-2 border-transparent py-1.5 pl-3 pr-2 text-[13px] text-slate-600 transition hover:border-teal-600 hover:text-slate-900"
              >
                <span className="truncate">{g.title}</span>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {g.endpoints.length}
                </span>
              </a>
            ))}
            <a
              href="#access"
              className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-[13px] text-slate-600 hover:border-teal-600 hover:text-slate-900"
            >
              Role access matrix
            </a>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 space-y-10">
          {/* Intro */}
          {!filtering && (
            <section>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900">
                Everything you need to sell, ship and manage medicine orders
                through one API.
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
                Customers browse and order, TSRs handle orders in their
                territory, and admins run the catalogue, users and sales
                reports. Search above, or open any endpoint to see its rules,
                body, response and a ready-to-run cURL.
              </p>

              <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {steps.map(([title, text], i) => (
                  <li
                    key={title}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-semibold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {title}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-slate-600">
                      {text}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["401", "Missing or blacklisted token"],
                  ["403", "Invalid or expired token"],
                  [
                    "Rate limits",
                    "Register 5 per 15 min · Login 10 per 5 min, per IP",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{k}</p>
                    <p className="text-[13px] text-slate-600">{v}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filtering && (
            <p className="text-sm text-slate-500" aria-live="polite">
              {total} of {allTotal} endpoints match.{" "}
              <button
                className="font-medium text-teal-700 hover:underline"
                onClick={() => {
                  setQuery("");
                  setMethod(null);
                  setAccess(null);
                }}
              >
                Clear filters
              </button>
            </p>
          )}

          {total === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="font-medium text-slate-700">
                Nothing matches that search
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try “cart”, “approve”, “TSR” or a path like /v1/orders.
              </p>
            </div>
          )}

          {/* Groups */}
          {groups.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {g.title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {g.description}
              </p>

              <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {g.endpoints.map((e) => {
                  const k = keyOf(g.id, e);
                  const isOpen = open.has(k);
                  return (
                    <article key={k}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                      >
                        <span
                          className={`mt-0.5 w-[58px] shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-bold ${methodTone[e.method]}`}
                        >
                          {e.method}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-all">
                            <Path path={e.path} />
                          </span>
                          <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">
                            {e.summary}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-flex ${accessTone[e.access]}`}
                        >
                          {e.access === "Public" ? (
                            <Globe size={11} />
                          ) : e.access === "Customer" ? (
                            <KeyRound size={11} />
                          ) : (
                            <Lock size={11} />
                          )}
                          {e.access}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`mt-1 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:pl-[86px]">
                          {e.details.length > 0 && (
                            <ul className="space-y-1.5">
                              {e.details.map((d) => (
                                <li
                                  key={d}
                                  className="flex gap-2 text-[13px] leading-5 text-slate-700"
                                >
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-600" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="grid gap-3 xl:grid-cols-2">
                            {e.body && (
                              <Code title="Request body" code={e.body} />
                            )}
                            {e.response && (
                              <Code title="Response" code={e.response} />
                            )}
                          </div>
                          <Code title="cURL" code={toCurl(e)} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Matrix */}
          {!filtering && (
            <section id="access" className="scroll-mt-28">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Role access matrix
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Customer and TSR access to profile, cart and order routes needs
                an approved account. Admins skip the approval check. TSR
                territory routes check the TSR role only.
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <th className="px-4 py-2.5 font-medium">API group</th>
                      {ACCESS.map((a) => (
                        <th
                          key={a}
                          className="px-3 py-2.5 text-center font-medium"
                        >
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roleMatrix.map((r) => (
                      <tr key={r.group} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">
                          {r.group}
                        </td>
                        {[r.public, r.customer, r.admin, r.tsr].map((ok, i) => (
                          <td key={i} className="px-3 py-2.5 text-center">
                            {ok ? (
                              <Check
                                size={15}
                                className="mx-auto text-teal-600"
                                aria-label="Allowed"
                              />
                            ) : (
                              <span
                                className="text-slate-300"
                                aria-label="Not allowed"
                              >
                                –
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
