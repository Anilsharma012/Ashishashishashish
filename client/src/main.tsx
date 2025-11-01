import React from "react";
import { createRoot } from "react-dom/client";
import App from "../App";

createRoot(document.getElementById("root")!).render(<App />);

/* ===== PWA bootstrap: SW + minimal install button (no design change) ===== */
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

(function initPWA() {
  // 1) Service Worker register
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    });
  }

  // 2) Show "Install App" button ONLY when browser allows
  let deferred: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;

    // create a tiny floating button (doesn't disturb your layout)
    if (document.getElementById("pwa-install-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.textContent = "Install App";
    Object.assign(btn.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "9999",
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid #b91c1c",
      background: "#b91c1c",
      color: "#fff",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    });

    btn.onclick = async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      btn.remove(); // hide after one use
      localStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!localStorage.getItem("pwa-prompt-dismissed")) {
      document.body.appendChild(btn);
    }
  });

  // If app gets installed, remove button if present
  window.addEventListener("appinstalled", () => {
    const el = document.getElementById("pwa-install-btn");
    if (el) el.remove();
    localStorage.removeItem("pwa-prompt-dismissed");
  });
})();
