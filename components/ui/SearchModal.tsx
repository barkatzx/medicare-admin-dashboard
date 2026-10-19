// src/components/ui/SearchModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface SearchItem {
  name: string;
  href: string;
  icon: any;
  category: string;
  keywords: string[];
}

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
    name: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    category: "Support",
    keywords: ["support", "faq", "guide"],
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const results = menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.keywords.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery),
        ),
    );

    setSearchResults(results);
    setSelectedIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      navigateTo(searchResults[selectedIndex].href);
    }
  };

  const navigateTo = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start justify-center min-h-screen pt-20 px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search pages, features, or settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 text-lg bg-transparent focus:outline-none"
                autoFocus
              />
              <button
                onClick={onClose}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div>
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                  Results
                </div>
                {searchResults.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                        selectedIndex === index ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Icon size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              searchQuery && (
                <div className="px-4 py-8 text-center">
                  <Search size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    No results found for "{searchQuery}"
                  </p>
                </div>
              )
            )}
            {!searchQuery && (
              <div className="px-4 py-8">
                <p className="text-sm text-gray-500 text-center mb-4">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {menuItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => navigateTo(item.href)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Icon size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-700">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
