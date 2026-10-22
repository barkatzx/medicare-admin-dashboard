"use client";

import { api } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import InstallApp from "@/components/layout/InstallApp";
import {
  BadgeAlert,
  BarChart3,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LineChart,
  LogOut,
  Package,
  PackageCheck,
  PackageX,
  ShoppingCart,
  Star,
  Tags,
  TrendingUp,
  Truck,
  UserCheck,
  UserCog,
  Users,
  Warehouse,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/* ----------------------------- Types & data ----------------------------- */

interface SubItem {
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface NavLinkItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

type GroupKey = "tsr" | "customers" | "inventory" | "orders";

const tsrItems: SubItem[] = [
  {
    name: "Analytics",
    href: "/dashboard/tsr-info/tsr-summary",
    icon: LineChart,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    name: "Summary",
    href: "/dashboard/tsr-info/tsr-sales",
    icon: CircleDollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

const customerItems: SubItem[] = [
  {
    name: "Pending",
    href: "/dashboard/users/pending-users",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    name: "Active",
    href: "/dashboard/users/active-users",
    icon: UserCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    name: "TSR's",
    href: "/dashboard/users/tsr",
    icon: UserCog,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
];

const inventoryItems: SubItem[] = [
  {
    name: "Products",
    href: "/dashboard/products/all-products",
    icon: Boxes,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "Trending",
    href: "/dashboard/products/trending",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    name: "Featured",
    href: "/dashboard/products/featured",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    name: "Low Stock",
    href: "/dashboard/products/low-stock",
    icon: BadgeAlert,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    name: "Out of Stock",
    href: "/dashboard/products/out-of-stock",
    icon: PackageX,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    name: "Categories",
    href: "/dashboard/products/categories",
    icon: Tags,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    name: "Distributors",
    href: "/dashboard/distributors",
    icon: Warehouse,
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
];

const orderItems: SubItem[] = [
  {
    name: "Pending",
    href: "/dashboard/orders/pending-orders",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    name: "Delivered",
    href: "/dashboard/orders/delivered-orders",
    icon: PackageCheck,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    name: "Cancelled",
    href: "/dashboard/orders/cancel-orders",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

const groups: {
  key: GroupKey;
  label: string;
  icon: LucideIcon;
  items: SubItem[];
}[] = [
  { key: "tsr", label: "TSR's", icon: UserCog, items: tsrItems },
  { key: "customers", label: "Customers", icon: Users, items: customerItems },
  {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    items: inventoryItems,
  },
  { key: "orders", label: "Orders", icon: ShoppingCart, items: orderItems },
];

const topLink: NavLinkItem = {
  name: "Analytics",
  href: "/dashboard",
  icon: LayoutDashboard,
};

const bottomLinks: NavLinkItem[] = [
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Shipments", href: "/dashboard/today-shipments", icon: Truck },
];

const footerLinks: NavLinkItem[] = [
  { name: "Documentation", href: "/dashboard/documentation", icon: BookOpen },
];

/* -------------------------------- Helpers ------------------------------- */

const matchesPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

const isGroupActive = (pathname: string, items: SubItem[]) =>
  items.some((item) => matchesPath(pathname, item.href));

const ACTIVE_CLASS = "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700";
const IDLE_CLASS = "text-gray-600 hover:bg-gray-50 hover:text-blue-600";
const ACTIVE_BAR = (
  <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
);

const iconClass = (active: boolean) =>
  `flex-shrink-0 transition-all duration-200 ${
    active
      ? "text-blue-600"
      : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"
  }`;

const PAGE_SIZE = 100;
const BATCH_SIZE = 5;

const isPendingCustomer = (u: { isApproved?: boolean; role?: string }) =>
  !u.isApproved && u.role === "customer";

async function countPendingCustomers(): Promise<number> {
  const firstPage = await api.getUsers(1, PAGE_SIZE);
  let count = firstPage.users.filter(isPendingCustomer).length;
  const totalPages = firstPage.pagination.pages;

  for (let start = 2; start <= totalPages; start += BATCH_SIZE) {
    const pageNumbers = Array.from(
      { length: Math.min(BATCH_SIZE, totalPages - start + 1) },
      (_, i) => start + i,
    );
    const pages = await Promise.all(
      pageNumbers.map((p) => api.getUsers(p, PAGE_SIZE)),
    );
    count += pages.reduce(
      (sum, page) => sum + page.users.filter(isPendingCustomer).length,
      0,
    );
  }
  return count;
}

async function countPendingOrders(): Promise<number> {
  const data = await api.getAllOrders(1, 1, "pending");
  return data?.pagination?.total || data?.orders?.length || 0;
}

/** Polls a counter every 30s and refreshes when a window event fires. */
function usePolledCount(fetcher: () => Promise<number>, eventName: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      try {
        setCount(await fetcher());
      } catch (error) {
        console.error(`Failed to fetch count for ${eventName}:`, error);
      }
    };

    refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener(eventName, refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(eventName, refresh);
    };
  }, [fetcher, eventName]);

  return count;
}

/* ------------------------------ Sub-components -------------------------- */

function NavLink({
  item,
  active,
  showText,
  isCollapsed,
}: {
  item: NavLinkItem;
  active: boolean;
  showText: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isCollapsed ? "justify-start md:justify-center" : ""
      } ${active ? ACTIVE_CLASS : IDLE_CLASS}`}
    >
      <Icon size={20} className={iconClass(active)} />
      {showText && (
        <span className="text-sm font-medium whitespace-nowrap">
          {item.name}
        </span>
      )}
      {active && showText && ACTIVE_BAR}
    </Link>
  );
}

function NavGroup({
  label,
  icon: Icon,
  items,
  pathname,
  open,
  onToggle,
  showText,
  isCollapsed,
  badge = 0,
  badgeHref,
}: {
  label: string;
  icon: LucideIcon;
  items: SubItem[];
  pathname: string;
  open: boolean;
  onToggle: () => void;
  showText: boolean;
  isCollapsed: boolean;
  badge?: number;
  badgeHref?: string;
}) {
  const active = isGroupActive(pathname, items);

  return (
    <div>
      <button
        onClick={() => showText && onToggle()}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isCollapsed ? "justify-start md:justify-center" : ""
        } ${active ? ACTIVE_CLASS : IDLE_CLASS}`}
      >
        <Icon size={20} className={iconClass(active)} />
        {showText && (
          <>
            <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
              {label}
            </span>
            {badge > 0 && !open && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                {badge}
              </span>
            )}
            <ChevronRight
              size={14}
              className={`transition-transform duration-300 ${open ? "rotate-90" : ""} ${
                active ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </>
        )}
        {active && showText && ACTIVE_BAR}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open && showText ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-0.5 mb-1 space-y-0.5">
          {items.map((sub) => {
            const isActive = matchesPath(pathname, sub.href);
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? ACTIVE_CLASS
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200 ${
                    isActive ? "bg-blue-100" : `${sub.bg} group-hover:scale-110`
                  }`}
                >
                  <SubIcon
                    size={12}
                    className={isActive ? "text-blue-600" : sub.color}
                  />
                </span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {sub.name}
                </span>
                {sub.href === badgeHref && badge > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Sidebar ------------------------------ */

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const sidebarRef = useRef<HTMLElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>(
    () => ({
      tsr: isGroupActive(pathname, tsrItems),
      customers: isGroupActive(pathname, customerItems),
      inventory: isGroupActive(pathname, inventoryItems),
      orders: isGroupActive(pathname, orderItems),
    }),
  );

  const getPendingOrders = useCallback(countPendingOrders, []);
  const getPendingCustomers = useCallback(countPendingCustomers, []);
  const pendingOrdersCount = usePolledCount(getPendingOrders, "ordersUpdated");
  const pendingCustomersCount = usePolledCount(
    getPendingCustomers,
    "usersUpdated",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileOpen || isDesktopViewport) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("a")?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileClose();
        return;
      }

      if (event.key !== "Tab" || !sidebarRef.current) return;
      const focusableItems = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ),
      ).filter((item) => item.getClientRects().length > 0);
      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem?.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileOpen, isDesktopViewport, onMobileClose]);

  // Auto-open the group that contains the current route
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      groups.forEach((g) => {
        if (isGroupActive(pathname, g.items)) next[g.key] = true;
      });
      return next;
    });
  }, [pathname]);

  // Restore collapsed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) setIsCollapsed(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleGroup = (key: GroupKey) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    if (isMobileOpen && !isDesktopViewport) onMobileClose();
    await dispatch(logout());
    router.push("/login");
  };

  const showText = !isCollapsed || isHovered || !isDesktopViewport;
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  const badges: Record<GroupKey, { count: number; href?: string }> = {
    tsr: { count: 0 },
    customers: {
      count: pendingCustomersCount,
      href: "/dashboard/users/pending-users",
    },
    inventory: { count: 0 },
    orders: {
      count: pendingOrdersCount,
      href: "/dashboard/orders/pending-orders",
    },
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        ref={sidebarRef}
        id="mobile-navigation"
        aria-label="Primary navigation"
        aria-hidden={!isDesktopViewport && !isMobileOpen}
        aria-modal={!isDesktopViewport ? isMobileOpen : undefined}
        role={!isDesktopViewport ? "dialog" : undefined}
        inert={!isDesktopViewport && !isMobileOpen}
        className={`fixed left-0 top-0 bottom-0 w-64 ${isCollapsed ? "md:w-20" : "md:w-64"} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } bg-[#f9fafb] rounded-none md:left-3 md:top-3 md:bottom-3 md:rounded-2xl flex flex-col transition-all duration-300 z-50 md:z-30 border border-gray-100 md:translate-x-0`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(event) => {
          if (
            isMobileOpen &&
            !isDesktopViewport &&
            event.target instanceof Element &&
            event.target.closest("a")
          ) {
            onMobileClose();
          }
        }}
      >
        {/* Logo */}
        <div
          className={`relative p-5 ${isCollapsed ? "px-3" : ""} border-b border-gray-100`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  className="rounded-lg border border-gray-100"
                  width={50}
                  height={50}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
              </div>
              {showText && (
                <div className="whitespace-nowrap">
                  <h1 className="text-sm font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    MediCarePLC
                  </h1>
                  <p className="text-[10px] text-gray-400 -mt-0.5">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-[10px] text-gray-400 -mt-0.5">
                    Version 2.0.5
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`absolute -right-3 top-6 hidden bg-white border border-gray-100 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 md:inline-block ${
                isCollapsed ? "rotate-180" : ""
              }`}
            >
              <ChevronLeft size={12} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden">
          {showText && (
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Main Menu
            </p>
          )}
          <div className="space-y-1">
            <NavLink
              item={topLink}
              active={pathname === topLink.href}
              showText={showText}
              isCollapsed={isCollapsed}
            />

            {groups.map((group) => (
              <NavGroup
                key={group.key}
                label={group.label}
                icon={group.icon}
                items={group.items}
                pathname={pathname}
                open={openGroups[group.key]}
                onToggle={() => toggleGroup(group.key)}
                showText={showText}
                isCollapsed={isCollapsed}
                badge={badges[group.key].count}
                badgeHref={badges[group.key].href}
              />
            ))}

            {bottomLinks.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                showText={showText}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          {footerLinks.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              showText={showText}
              isCollapsed={isCollapsed}
            />
          ))}
          <InstallApp />
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ${
              isCollapsed ? "justify-start md:justify-center" : ""
            }`}
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
      </aside>

      {/* Spacer for layout */}
      <div
        aria-hidden="true"
        className={`hidden ${sidebarWidth} ml-3 transition-all duration-300 md:block`}
      />
    </>
  );
}
