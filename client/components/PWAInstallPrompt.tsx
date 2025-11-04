import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function isIOS() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window as any).navigator?.standalone === true;
    if (installed) {
      setIsInstalled(true);
      return;
    }

    // Check if user has already dismissed this prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      return;
    }

    // Check if already stored as installed
    if (localStorage.getItem("pwa-installed") === "true") {
      setIsInstalled(true);
      return;
    }

    // iOS only: Show guide after a delay
    let iosTimer: number | undefined;
    if (isIOS()) {
      iosTimer = window.setTimeout(() => {
        if (!installed && !localStorage.getItem("pwa-install-dismissed")) {
          setShowPrompt(true);
        }
      }, 2000);
    }

    // When app gets installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem("pwa-install-dismissed");
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt || !isIOS()) {
    return null;
  }

  // iOS install guide
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full md:rounded-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full"
          aria-label="Dismiss"
          type="button"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="p-6 text-center">
          <h3 className="font-bold text-xl mb-2">Install Ashish Properties</h3>
          <p className="text-gray-600 mb-4">Get quick access on your home screen</p>

          <div className="bg-blue-50 rounded-lg p-4 text-left mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Steps to install:</p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Tap <strong>Share</strong> (↗️) at the bottom</li>
              <li>Select <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </ol>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            type="button"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
