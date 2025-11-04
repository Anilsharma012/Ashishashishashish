import { useState, useEffect } from "react";
import { Download, X, Smartphone, FileDown } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWAInstallButton = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
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
      setIsInstalling(false);
      localStorage.setItem("pwa-installed", "true");
      localStorage.removeItem("pwa-install-dismissed");
      toast({
        title: "Success! 🎉",
        description: "App installed successfully. You can now launch it from your home screen.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        // Show the browser's install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
          setIsInstalled(true);
          setShowInstallButton(false);
          localStorage.setItem("pwa-installed", "true");
          toast({
            title: "Installation Started 📱",
            description: "Check your home screen for the app icon.",
          });
        } else {
          console.log("User dismissed the install prompt");
          toast({
            description: "You can try again anytime from the menu.",
          });
        }

        // Clear the saved prompt since it can only be used once
        setDeferredPrompt(null);
      } else {
        // Fallback: show installation instructions
        toast({
          title: "PWA Installation Guide",
          description:
            "Android: Tap menu (⋮) → Install app\n" +
            "Chrome: Look for install icon in address bar\n" +
            "Safari: Tap Share → Add to Home Screen",
        });
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
      toast({
        title: "Installation Error",
        description: "Please try again or use the APK download option.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleAPKDownload = async () => {
    setIsInstalling(true);
    try {
      // Try direct download
      const response = await fetch("/api/app/download", { method: "HEAD" });

      if (response.ok) {
        // Create download link
        const link = document.createElement("a");
        link.href = "/api/app/download";
        link.download = "AshishProperty.apk";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);

        toast({
          title: "Download Started 📥",
          description: "APK file is being downloaded to your device.",
        });
      } else {
        toast({
          title: "APK Not Available",
          description: "Please use the PWA installation method instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downloading APK:", error);
      toast({
        title: "Download Error",
        description: "Unable to download APK. Try PWA installation instead.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if installed or dismissed
  if (isInstalled || !isVisible) {
    return null;
  }

  // Show install button with different states
  if (showInstallButton) {
    return (
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
              disabled={isInstalling}
              type="button"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              onClick={handleInstallClick}
              disabled={isInstalling}
              size="sm"
              className="flex-1 bg-white text-[#C70000] hover:bg-gray-100 font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-[#C70000] rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span>Install App</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleAPKDownload}
              disabled={isInstalling}
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30 border border-white/30 flex-1 md:flex-none font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              variant="outline"
            >
              <FileDown className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">APK</span>
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-red-100 mt-3 leading-relaxed">
            💡 Choose "Install App" to add to your home screen, or download APK for manual installation.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallButton;
