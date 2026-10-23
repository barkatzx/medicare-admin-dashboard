"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const dismissedPromptKey = "medicare-install-prompt-dismissed";
const subscribeToStandalone = (onChange: () => void) => {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    mediaQuery.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
};
const getStandaloneSnapshot = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true);
const getIosSnapshot = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const getServerSnapshot = () => false;

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getServerSnapshot,
  );
  const isIOS = useSyncExternalStore(
    () => () => {},
    getIosSnapshot,
    getServerSnapshot,
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (sessionStorage.getItem(dismissedPromptKey)) return;
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === "dismissed") {
        sessionStorage.setItem(dismissedPromptKey, "true");
      }
    } catch (installError) {
      console.error("Unable to open the app installation prompt:", installError);
      setError("The installation prompt could not be opened. Try again later.");
    }
  };

  if (isStandalone || (!isIOS && !installPrompt)) return null;

  return (
    <div className="space-y-2 md:hidden">
      {isIOS ? (
        <button
          type="button"
          onClick={() => setShowInstructions((show) => !show)}
          aria-expanded={showInstructions}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
        >
          <Share size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Add to Home Screen</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
        >
          <Download size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Install App</span>
        </button>
      )}
      {isIOS && showInstructions && (
        <p className="px-3 text-xs leading-relaxed text-gray-500">
          Tap your browser&apos;s Share button, then choose &quot;Add to Home
          Screen&quot;.
        </p>
      )}
      {error && (
        <p role="alert" className="px-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
