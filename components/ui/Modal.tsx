// src/components/ui/Modal.tsx
"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const openDialogs: HTMLElement[] = [];
let originalBodyOverflow: string | null = null;
const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  isDismissible?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  isDismissible = true,
}: ModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  const isDismissibleRef = useRef(isDismissible);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isDismissibleRef.current = isDismissible;
  }, [isDismissible]);

  const handleClose = useCallback(() => {
    if (!isDismissibleRef.current) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsAnimating(true);
    closeTimeoutRef.current = setTimeout(() => {
      onCloseRef.current();
      setIsAnimating(false);
      closeTimeoutRef.current = null;
    }, 200);
  }, []);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement;
    if (openDialogs.length === 0) {
      originalBodyOverflow = document.body.style.overflow;
    }
    openDialogs.push(dialog);
    document.body.style.overflow = "hidden";
    setIsAnimating(true);

    const focusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

    const focusFrame = requestAnimationFrame(() => {
      (focusableElements()[0] ?? dialog).focus();
    });
    const animationTimeout = setTimeout(() => setIsAnimating(false), 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== dialog) return;

      if (event.key === "Escape" && isDismissible) {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      clearTimeout(animationTimeout);
      document.removeEventListener("keydown", handleKeyDown);

      const dialogIndex = openDialogs.indexOf(dialog);
      if (dialogIndex !== -1) openDialogs.splice(dialogIndex, 1);
      if (openDialogs.length === 0 && originalBodyOverflow !== null) {
        document.body.style.overflow = originalBodyOverflow;
        originalBodyOverflow = null;
      }

      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [handleClose, isDismissible, isOpen, mounted]);

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
    full: "sm:max-w-[90vw] sm:w-[90vw]",
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          {/* Modal Content */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 w-full ${sizeClasses[size]} ${
              isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3
                  id={titleId}
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h3>
              </div>
              {showCloseButton && isDismissible && (
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close dialog"
                  className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <X
                    size={18}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                </button>
              )}
            </div>

            {/* Content - Only one scrollbar here */}
            <div className="px-6 py-4 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
    </div>,
    document.body,
  );
}
