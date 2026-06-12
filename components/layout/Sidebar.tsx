"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
  Leaf,
  Layers2,
  AreaChart,
  Heart,
  TrendingUp,
  Grid3X3,
  Star,
  Clock,
  UserCheck,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { api } from "@/config/api";

// Products submenu items
const productSubItems = [
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Grid3X3,
    description: "Full inventory",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "Trending",
    href: "/dashboard/trending",
    icon: TrendingUp,
    description: "Top performers",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    name: "Featured",
    href: "/dashboard/featured",
    icon: Star,
    description: "Highlighted items",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    name: "Categories",
    href: "/dashboard/categories",
    icon: Layers2,
    description: "Organize products",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

// Users submenu items
const userSubItems = [
  {
    name: "Pending",
    href: "/dashboard/pending-users",
    icon: Clock,
    description: "Approve registrations",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    name: "Active",
    href: "/dashboard/users",
    icon: UserCheck,
    description: "Manage customers",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

// Orders submenu items
const orderSubItems = [
  {
    name: "Pending",
    href: "/dashboard/pending-orders",
    icon: Clock,
    description: "Manage active orders",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "Delivered",
    href: "/dashboard/orders",
    icon: CheckCircle,
    description: "Completed shipments",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    name: "Cancelled",
    href: "/dashboard/cancel-orders",
    icon: XCircle,
    description: "Invalidated orders",
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

const menuItems = [
  {
    name: "Analytics",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & analytics",
  },
  // Users, Inventory, and Orders are handled separately as dropdowns
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: AreaChart,
    description: "Sales analytics",
  },
];

const bottomMenuItems = [
  {
    name: "Documentation",
    href: "/dashboard/documentation",
    icon: Leaf,
    description: "User guides",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Preferences",
  },
  {
    name: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    description: "Support & docs",
  },
];

// Path helpers
const isProductsPath = (pathname: string) =>
  productSubItems.some(
    (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"),
  );

const isUsersPath = (pathname: string) =>
  userSubItems.some(
    (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"),
  );

const isOrdersPath = (pathname: string) =>
  orderSubItems.some(
    (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"),
  );

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingCustomersCount, setPendingCustomersCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [productsOpen, setProductsOpen] = useState(() =>
    isProductsPath(pathname),
  );
  const [usersOpen, setUsersOpen] = useState(() => isUsersPath(pathname));
  const [ordersOpen, setOrdersOpen] = useState(() => isOrdersPath(pathname));

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-open dropdowns if path is active
  useEffect(() => {
    if (isProductsPath(pathname)) setProductsOpen(true);
    if (isUsersPath(pathname)) setUsersOpen(true);
    if (isOrdersPath(pathname)) setOrdersOpen(true);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) setIsCollapsed(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await api.getNotifications(true);
        const count = data?.unreadCount || data?.notifications?.length || 0;
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    const handleNotificationUpdate = () => fetchUnreadCount();
    window.addEventListener("notificationsUpdated", handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationUpdate,
      );
    };
  }, []);

  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      try {
        const data = await api.getAllOrders(1, 1, "pending");
        const count = data?.pagination?.total || data?.orders?.length || 0;
        setPendingOrdersCount(count);
      } catch (error) {
        console.error("Failed to fetch pending orders count:", error);
      }
    };

    fetchPendingOrdersCount();
    const interval = setInterval(fetchPendingOrdersCount, 30000);
    const handleOrderUpdate = () => fetchPendingOrdersCount();
    window.addEventListener("ordersUpdated", handleOrderUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("ordersUpdated", handleOrderUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchPendingCustomersCount = async () => {
      try {
        const { users } = await api.getUsers(1, 100);
        const count = users.filter(
          (u: any) => !u.isApproved && u.role !== "admin",
        ).length;
      } catch (error) {
        console.error("Failed to fetch pending customers count:", error);
      }
    };

    fetchPendingCustomersCount();
    const interval = setInterval(fetchPendingCustomersCount, 30000);
    const handleUsersUpdate = () => fetchPendingCustomersCount();
    window.addEventListener("usersUpdated", handleUsersUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("usersUpdated", handleUsersUpdate);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  const handleToggle = () => setIsCollapsed((v) => !v);
  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/login");
  };

  const showText = !isCollapsed || isHovered;
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";
  const productsActive = isProductsPath(pathname);
  const usersActive = isUsersPath(pathname);
  const ordersActive = isOrdersPath(pathname);

  return (
    <>
      <aside
        className={`fixed left-3 top-3 bottom-3 ${sidebarWidth} bg-white rounded-2xl flex flex-col transition-all duration-300 z-30 border border-gray-100`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div
          className={`relative p-5 ${isCollapsed ? "px-3" : ""} border-b border-gray-100`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
              </div>
              {showText && (
                <div className="transition-opacity duration-200 whitespace-nowrap">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    MediCarePLC
                  </h1>
                  <p className="text-[10px] text-gray-400 -mt-0.5">
                    Administration Portal
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleToggle}
              className={`absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            >
              <ChevronLeft size={12} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden">
          <div className="space-y-4">
            <div>
              {showText && (
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  Main Menu
                </p>
              )}
              <div className="space-y-1">
                {/* Analytics */}
                {menuItems.slice(0, 1).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200
                        ${isCollapsed ? "justify-center" : ""}
                        ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}
                      `}
                    >
                      <Icon
                        size={20}
                        className={`flex-shrink-0 transition-all duration-200 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"}`}
                      />
                      {showText && (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                      {isActive && showText && (
                        <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                      )}
                    </Link>
                  );
                })}

                {/* ── Users Dropdown ── */}
                <div>
                  <button
                    onClick={() => {
                      if (!isCollapsed || isHovered) setUsersOpen((v) => !v);
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${usersActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}
                    `}
                  >
                    <Users
                      size={20}
                      className={`flex-shrink-0 transition-all duration-200 ${usersActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"}`}
                    />
                    {showText && (
                      <>
                        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
                          Customers
                        </span>
                        {pendingCustomersCount > 0 && !usersOpen && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                            {pendingCustomersCount}
                          </span>
                        )}
                        <span
                          className={`transition-transform duration-300 ${usersOpen ? "rotate-90" : "rotate-0"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              usersActive ? "text-blue-500" : "text-gray-400"
                            }
                          />
                        </span>
                      </>
                    )}
                    {usersActive && showText && (
                      <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${usersOpen && showText ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="mt-0.5 mb-1 space-y-0.5">
                      {userSubItems.map((sub) => {
                        const isActive = pathname === sub.href;
                        const Icon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200 ${isActive ? "bg-blue-100" : `${sub.bg} group-hover:scale-110`}`}
                            >
                              <Icon
                                size={12}
                                className={
                                  isActive ? "text-blue-600" : sub.color
                                }
                              />
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {sub.name}
                            </span>
                            {sub.name === "Pending" &&
                              pendingCustomersCount > 0 && (
                                <span className="ml-auto bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {pendingCustomersCount}
                                </span>
                              )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Inventory Dropdown ── */}
                <div>
                  <button
                    onClick={() => {
                      if (!isCollapsed || isHovered) setProductsOpen((v) => !v);
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${productsActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}
                    `}
                  >
                    <Package
                      size={20}
                      className={`flex-shrink-0 transition-all duration-200 ${productsActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"}`}
                    />
                    {showText && (
                      <>
                        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
                          Inventory
                        </span>
                        <span
                          className={`transition-transform duration-300 ${productsOpen ? "rotate-90" : "rotate-0"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              productsActive ? "text-blue-500" : "text-gray-400"
                            }
                          />
                        </span>
                      </>
                    )}
                    {productsActive && showText && (
                      <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${productsOpen && showText ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="mt-0.5 mb-1 space-y-0.5">
                      {productSubItems.map((sub) => {
                        const isActive = pathname === sub.href;
                        const Icon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200 ${isActive ? "bg-blue-100" : `${sub.bg} group-hover:scale-110`}`}
                            >
                              <Icon
                                size={12}
                                className={
                                  isActive ? "text-blue-600" : sub.color
                                }
                              />
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {sub.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Orders Dropdown ── */}
                <div>
                  <button
                    onClick={() => {
                      if (!isCollapsed || isHovered) setOrdersOpen((v) => !v);
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${ordersActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <ShoppingBag
                        size={20}
                        className={`transition-all duration-200 ${ordersActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"}`}
                      />
                    </div>
                    {showText && (
                      <>
                        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
                          Orders
                        </span>
                        {pendingOrdersCount > 0 && !ordersOpen && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                            {pendingOrdersCount}
                          </span>
                        )}
                        <span
                          className={`transition-transform duration-300 ${ordersOpen ? "rotate-90" : "rotate-0"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              ordersActive ? "text-blue-500" : "text-gray-400"
                            }
                          />
                        </span>
                      </>
                    )}
                    {ordersActive && showText && (
                      <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${ordersOpen && showText ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="mt-0.5 mb-1 space-y-0.5">
                      {orderSubItems.map((sub) => {
                        const isActive = pathname === sub.href;
                        const Icon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200 ${isActive ? "bg-blue-100" : `${sub.bg} group-hover:scale-110`}`}
                            >
                              <Icon
                                size={12}
                                className={
                                  isActive ? "text-blue-600" : sub.color
                                }
                              />
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {sub.name}
                            </span>
                            {sub.name === "Pending" &&
                              pendingOrdersCount > 0 && (
                                <span className="ml-auto bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {pendingOrdersCount}
                                </span>
                              )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reports */}
                {menuItems.slice(1).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200
                        ${isCollapsed ? "justify-center" : ""}
                        ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}
                      `}
                    >
                      <Icon
                        size={20}
                        className={`flex-shrink-0 transition-all duration-200 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"}`}
                      />
                      {showText && (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                      {isActive && showText && (
                        <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Updates Section */}
            <div>
              {showText && (
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  Updates
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/dashboard/notifications"
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center" : ""} ${pathname === "/dashboard/notifications" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}`}
                >
                  <div className="relative flex-shrink-0">
                    <Bell
                      size={20}
                      className={`transition-all duration-200 ${pathname === "/dashboard/notifications" ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {showText && (
                    <>
                      <span className="text-sm font-medium whitespace-nowrap">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="ml-auto text-xs text-red-500 font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Menu */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="space-y-1">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center" : ""} ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"}`}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-all duration-200 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}
                  />
                  {showText && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${isCollapsed ? "justify-center" : ""}`}
            >
              <LogOut
                size={20}
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              {showText && (
                <span className="text-sm font-medium whitespace-nowrap">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for layout */}
      <div className={`${sidebarWidth} ml-3 transition-all duration-300`} />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </>
  );
}
