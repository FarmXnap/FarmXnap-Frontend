import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import XnapLogo from "../assets/pwa-512x512.png";

/**
 * InstallPrompt
 * Shows a custom "Add to Home Screen" banner when the browser
 * fires the beforeinstallprompt event (Chrome / Android).
 * On iOS it shows manual instructions since iOS doesn't support the event.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    // Already installed — don't show anything
    if (isInStandaloneMode) return;

    // Check if user already dismissed it this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    if (isIOS) {
      // iOS: show manual instructions after a short delay
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: listen for the install event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  // Android install banner
  if (showBanner && !dismissed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 max-w-md mx-auto">
        <div className="bg-brand-card border border-brand-green/40 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            {/* App icon placeholder */}
            <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={XnapLogo}
                alt="FarmXnap Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-syne font-bold text-white text-sm mb-0.5">
                Install FarmXnap
              </p>
              <p className="text-brand-muted text-xs font-dm leading-relaxed">
                Add to your home screen for faster access — works offline too.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-brand-muted flex-shrink-0 p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl border border-brand-surface text-brand-muted text-sm font-dm active:scale-95 transition-all"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-syne font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download size={15} />
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS manual install guide
  if (showIOSGuide && !dismissed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 max-w-md mx-auto">
        <div className="bg-brand-card border border-brand-surface rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-brand-green" />
              <p className="font-syne font-bold text-white text-sm">
                Add to Home Screen
              </p>
            </div>
            <button onClick={handleDismiss} className="text-brand-muted p-1">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              {
                step: "1",
                text: "Tap the Share button at the bottom of Safari",
              },
              { step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
              {
                step: "3",
                text: 'Tap "Add" — FarmXnap appears on your home screen',
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{step}</span>
                </div>
                <p className="text-brand-muted text-xs font-dm leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
