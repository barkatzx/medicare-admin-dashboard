// src/components/layout/Header.tsx
"use client";

import SearchModal from "@/components/ui/SearchModal";
import { useAppSelector } from "@/store/hooks";
import {
  ArrowRight,
  BarChart3,
  Bell,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchItem {
  name: string;
  href: string;
  icon: any;
  category: string;
  keywords: string[];
}

export default function Header() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Define all searchable routes
  const menuItems: SearchItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      category: "Navigation",
      keywords: ["home", "main", "overview"],
    },
    {
      name: "Users",
      href: "/dashboard/users",
      icon: Users,
      category: "Management",
      keywords: ["customers", "accounts", "people"],
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: Package,
      category: "Management",
      keywords: ["items", "inventory", "stock"],
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: FolderTree,
      category: "Management",
      keywords: ["tags", "groups", "types"],
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingCart,
      category: "Management",
      keywords: ["sales", "purchases", "transactions"],
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
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      category: "Account",
      keywords: ["alerts", "updates"],
    },
    {
      name: "Help",
      href: "/dashboard/help",
      icon: HelpCircle,
      category: "Support",
      keywords: ["support", "faq", "guide"],
    },
  ];

  // Search function
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.keywords.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery),
        ),
    );

    const sortedResults = results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
      const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return a.name.length - b.name.length;
    });

    setSearchResults(sortedResults);
    setShowResults(sortedResults.length > 0);
  }, []);

  // Handle search input change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setIsSearchFocused(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchQuery("");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const navigateTo = (href: string) => {
    router.push(href);
    clearSearch();
  };

  // Keyboard shortcut for search modal (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const groupedResults = searchResults.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>,
  );

  return (
    <>
      <header className="bg-[#F9FAFB]">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left Section - Welcome Message */}
          <div className="flex-1">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Here's what's happening with your store today
              </p>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div
              className={`relative transition-all duration-200 ${isSearchFocused ? "scale-105" : ""}`}
            >
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search anything... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery) performSearch(searchQuery);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-24 py-2.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md font-mono">
                ⌘K
              </kbd>
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
                <div className="max-h-96 overflow-y-auto">
                  {Object.entries(groupedResults).map(([category, items]) => (
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
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                  <span>Press ⏎ to navigate</span>
                  <span>ESC to close</span>
                </div>
              </div>
            )}

            {/* No Results */}
            {showResults && searchResults.length === 0 && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-8 text-center">
                  <Search size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    No results found for "{searchQuery}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - User Avatar, Name & Role */}
          <div className="flex-1 flex justify-end" ref={profileRef}>
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>

                {/* Name and Role */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || "Administrator"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </header>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </>
  );
}
