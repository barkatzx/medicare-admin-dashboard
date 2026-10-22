// src/components/layout/Header.tsx
"use client";

import SearchModal from "@/components/ui/SearchModal";
import { useAppSelector } from "@/store/hooks";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface HeaderProps {
  onOpenMobileNav: () => void;
  isMobileNavOpen: boolean;
  menuButtonRef: React.RefObject<HTMLButtonElement>;
}

interface SearchItem {
  name: string;
  href: string;
  icon: LucideIcon;
  category: string;
  keywords: string[];
}

// Searchable routes (kept in sync with the sidebar)
const SEARCH_ITEMS: SearchItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    category: "Navigation",
    keywords: ["home", "main", "overview", "analytics"],
  },
  {
    name: "Customers",
    href: "/dashboard/users/active-users",
    icon: Users,
    category: "Management",
    keywords: ["users", "accounts", "people", "pending"],
  },
  {
    name: "TSR's",
    href: "/dashboard/users/tsr",
    icon: UserCog,
    category: "Management",
    keywords: ["employees", "staff", "sales representative"],
  },
  {
    name: "Products",
    href: "/dashboard/products/all-products",
    icon: Boxes,
    category: "Management",
    keywords: ["items", "inventory", "stock"],
  },
  {
    name: "Categories",
    href: "/dashboard/products/categories",
    icon: Tags,
    category: "Management",
    keywords: ["tags", "groups", "types"],
  },
  {
    name: "Distributors",
    href: "/dashboard/distributors",
    icon: Warehouse,
    category: "Management",
    keywords: ["suppliers", "vendors"],
  },
  {
    name: "Orders",
    href: "/dashboard/orders/pending-orders",
    icon: ShoppingCart,
    category: "Management",
    keywords: ["sales", "purchases", "transactions"],
  },
  {
    name: "Shipments",
    href: "/dashboard/today-shipments",
    icon: Truck,
    category: "Management",
    keywords: ["delivery", "shipping"],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    category: "Analytics",
    keywords: ["analytics", "statistics", "sales"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    category: "Account",
    keywords: ["preferences", "profile", "account"],
  },
  {
    name: "Documentation",
    href: "/dashboard/documentation",
    icon: BookOpen,
    category: "Support",
    keywords: ["help", "support", "faq", "guide"],
  },
];

function searchItems(query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return SEARCH_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.keywords.some((keyword) => keyword.includes(q)),
  ).sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? 1 : 0;
    const bExact = b.name.toLowerCase() === q ? 1 : 0;
    return bExact - aExact || a.name.length - b.name.length;
  });
}

export default function Header({
  onOpenMobileNav,
  isMobileNavOpen,
  menuButtonRef,
}: HeaderProps) {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const searchResults = useMemo(() => searchItems(searchQuery), [searchQuery]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    searchResults.forEach((item) => {
      (groups[item.category] ??= []).push(item);
    });
    return groups;
  }, [searchResults]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowResults(false);
      }
      if (
        !profileRef.current?.contains(target) &&
        !mobileProfileRef.current?.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K / Ctrl+K opens the search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
  };

  const navigateTo = (href: string) => {
    router.push(href);
    clearSearch();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") clearSearch();
    if (e.key === "Enter" && searchResults[0])
      navigateTo(searchResults[0].href);
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <>
      <header className="bg-[#F9FAFB]">
        <div className="hidden items-center justify-between px-6 py-3 md:flex">
          {/* Left - Date */}
          <div className="flex-1 flex items-center gap-2 text-sm text-gray-700">
            <span className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center">
              <CalendarDays size={16} className="text-gray-500" />
            </span>
            <span>{todayLabel}</span>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-xs relative" ref={searchRef}>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search anything... (⌘K)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={handleInputKeyDown}
                className="w-full pl-11 pr-24 py-2.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md font-mono">
                ⌘K
              </kbd>
            </div>

            {/* Results dropdown */}
            {showResults && hasQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <>
                    <div className="max-h-96 overflow-y-auto">
                      {Object.entries(groupedResults).map(
                        ([category, items]) => (
                          <div key={category}>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {category}
                              </span>
                            </div>
                            {items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.href}
                                  onClick={() => navigateTo(item.href)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                                >
                                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                                    <Icon
                                      size={16}
                                      className="text-gray-600 group-hover:text-blue-600"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.href}
                                    </p>
                                  </div>
                                  <ArrowRight
                                    size={14}
                                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        ),
                      )}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                      <span>Press ⏎ to open first result</span>
                      <span>ESC to close</span>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      No results found for &quot;{searchQuery}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right - Settings & profile */}
          <div className="flex-1 flex justify-end items-center gap-3">
            <Link
              href="/dashboard/settings"
              aria-label="Settings"
              className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Settings size={18} />
            </Link>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((open) => !open)}
                aria-label="Profile"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 text-black font-semibold text-sm hover:text-blue-600 transition-colors"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 px-4 py-3 z-50">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || "Administrator"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className="flex min-w-0 items-center gap-2 px-2 py-2 md:hidden"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            aria-controls="mobile-navigation"
            aria-expanded={isMobileNavOpen}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gray-100 text-gray-700 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Menu size={22} />
          </button>

          <Link
            href="/dashboard"
            aria-label="MediCarePLC dashboard"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gray-100 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Image
              src="/logo.png"
              alt="MediCarePLC"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Open search"
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 text-left text-sm text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Search size={17} className="flex-none" />
            <span className="truncate">Search...</span>
          </button>

          <div className="flex flex-none items-center gap-1">
            <Link
              href="/dashboard/settings"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 transition-colors hover:text-blue-600"
            >
              <Settings size={18} />
            </Link>
            <div className="relative" ref={mobileProfileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                aria-label="Profile"
                aria-expanded={isProfileOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-sm font-semibold text-black transition-colors hover:text-blue-600"
              >
                {user?.name?.trim()?.charAt(0)?.toUpperCase() ||
                  user?.email?.trim()?.charAt(0)?.toUpperCase() ||
                  "A"}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name || user?.email || "Admin User"}
                  </p>
                  <p className="text-xs capitalize text-gray-500">
                    {user?.role || "Administrator"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </>
  );
}
