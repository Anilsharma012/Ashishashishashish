import { useState, useEffect } from "react";
import { Download, X, Smartphone, FileDown, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [installationAttempted, setInstallationAttempted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if running on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (PWA is installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
        localStorage.setItem("pwa-installed", "true");
        localStorage.removeItem("pwa-install-dismissed");
        return;
      }

      // Check localStorage for installation status
      const storedInstalled = localStorage.getItem("pwa-installed");
      if (storedInstalled === "true") {
        setIsInstalled(true);
        setShowInstallButton(false);
        return;
      }

      // Check if already dismissed today
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

        // Show again after 24 hours
        if (hoursSinceDismissed < 24) {
          setIsVisible(false);
          return;
        } else {
          localStorage.removeItem("pwa-install-dismissed");
        }
      }

      // On mobile devices, always show the button if not dismissed
      if (isMobile) {
        setShowInstallButton(true);
      }
    };

    checkInstalled();
  }, [isMobile]);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setShowInstallButton(true);
      setIsVisible(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setInstallationAttempted(false);
      localStorage.setItem("pwa-installed", "true");
      localStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    setInstallationAttempted(true);

    if (!deferredPrompt) {
      // Fallback: provide manual installation instructions
      alert(
        "PWA Installation:\n\n" +
          "On Android: Tap the menu (⋮) → Install app\n" +
          "On Chrome: Look for the install icon in the address bar\n" +
          "On Safari: Tap Share → Add to Home Screen"
      );
      return;
    }

    try {
      // Show the browser's install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstalled(true);
        setShowInstallButton(false);
        localStorage.setItem("pwa-installed", "true");
      } else {
        console.log("User dismissed the install prompt");
        // Show the dismiss button
        setInstallationAttempted(false);
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
    }

    // Clear the saved prompt since it can only be used once
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setInstallationAttempted(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleAPKDownload = async () => {
    try {
      // For now, open the APK download link or show a message
      // In production, this would download from your server
      const apkUrl = "/api/app/download";

      // Try to download the APK
      const response = await fetch(apkUrl, { method: "HEAD" });
      if (response.ok) {
        const link = document.createElement("a");
        link.href = apkUrl;
        link.download = "AshishProperty.apk";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("APK download initiated");
      } else {
        // Fallback: show instructions or message
        alert("APK download is currently unavailable. Please try the PWA installation instead.");
      }
    } catch (error) {
      console.error("Error downloading APK:", error);
      alert("Failed to download APK. Please try the PWA installation instead.");
    }
  };

  const handleOpenInstalledApp = () => {
    // This would open the app if it's installed
    // For PWA, the user should open it from their home screen
    alert("The app is already installed! Look for 'Ashish Property' on your home screen.");
  };

  // Don't show if installed or dismissed
  if (isInstalled || !isVisible) {
    return null;
  }

  // Show install button with different states
  if (showInstallButton) {
    return (
      <>
        {/* Mobile/Tablet Install Banner - positioned above bottom nav */}
        <div className="fixed left-0 right-0 z-40 bg-gradient-to-r from-[#C70000] to-[#A50000] text-white bottom-16 md:bottom-0 md:left-auto md:right-4 md:w-96 md:rounded-lg md:shadow-lg">
          <div className="p-4 md:p-5">
            {/* Header with icon and title */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-bold">Install Ashish Properties</h3>
                  <p className="text-xs text-red-100">Quick access on home screen</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors ml-2 shrink-0"
                aria-label="Dismiss"
                type="button"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="flex-1 bg-white text-[#C70000] hover:bg-gray-100 font-semibold text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Install App</span>
              </Button>
              <Button
                onClick={handleAPKDownload}
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30 border border-white/30 flex-1 md:flex-none font-semibold text-sm"
                variant="outline"
              >
                <FileDown className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">APK</span>
              </Button>
            </div>

            {/* Fallback help text */}
            {installationAttempted && !deferredPrompt && (
              <p className="text-xs text-red-100 mt-2">
                If the installer didn't open, try the APK download or check your browser menu.
              </p>
            )}
          </div>
        </div>

        {/* Add padding to body when banner is visible on mobile to prevent overlap */}
        <style>{`
          @media (max-width: 767px) {
            body {
              padding-bottom: 0;
            }
          }
        `}</style>
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
