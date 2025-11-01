import React, { useState, useEffect } from "react";
import { X, Star, Download } from "lucide-react";

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSGuide, setIsIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed?
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS standalone flag
      (window as any).navigator?.standalone === true;
    if (installed) {
      setIsInstalled(true);
      return;
    }

    // Chrome/Android: capture real install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      // Show our card (if not dismissed earlier)
      if (!localStorage.getItem("pwa-prompt-dismissed")) {
        setShowPrompt(true);
      }
    };

    // When app gets installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-prompt-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // iOS: no event -> show a small guide after delay (once)
    let iosTimer: number | undefined;
    if (isIOS() && !localStorage.getItem("pwa-prompt-dismissed")) {
      iosTimer = window.setTimeout(() => {
        if (!installed) {
          setIsIOSGuide(true);
          setShowPrompt(true);
        }
      }, 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    // Android/Chrome path
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice; // { outcome }
      } finally {
        // Only one use per saved event
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
      return;
    }

    // iOS: we show a guide, no alert
    if (isIOS()) {
      setIsIOSGuide(true);
      setShowPrompt(true);
      return;
    }

    // Other browsers: do nothing (avoid fake alerts)
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsIOSGuide(false);
    // Remember user choice
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-80">
      <div className="bg-blue-600 text-white rounded-xl shadow-2xl overflow-hidden mx-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-blue-700 rounded-full"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 text-center">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
            <img
              src="/icons/icon-192.png"
              alt="App Icon"
              className="w-10 h-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="w-10 h-10 bg-[#C70000] rounded-xl hidden items-center justify-center">
              <span className="text-white font-bold">AP</span>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-1">Ashish Property App</h3>
          <p className="text-sm opacity-90 mb-2">Buy &amp; Sell better with app</p>

          {!isIOSGuide && (
            <>
              <div className="flex items-center justify-center space-x-1 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm opacity-90 ml-2">4.5 • 10Cr+ Downloads</span>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span>Install App</span>
              </button>
            </>
          )}

          {isIOSGuide && (
            <div className="text-left bg-blue-700/30 rounded-lg p-3 mt-2">
              <p className="text-sm">
                iPhone/iPad par install karne ke liye:
              </p>
              <ol className="text-sm list-decimal ml-5 mt-1 space-y-1">
                <li>Safari me site kholke <strong>Share</strong> (□↑) dabao.</li>
                <li><strong>Add to Home Screen</strong> select karo.</li>
                <li><strong>Add</strong> press kar do.</li>
              </ol>
              <button
                onClick={handleDismiss}
                className="mt-3 w-full bg-white text-blue-700 py-2 rounded-md font-semibold hover:bg-gray-100"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
