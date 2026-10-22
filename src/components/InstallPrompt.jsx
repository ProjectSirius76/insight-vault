import { useEffect, useState } from "react";
import { styles } from "../styles.js";
import { isStandalone } from "../useAuth.js";

const DISMISS_KEY = "insight-vault-install-dismissed";
const DISMISS_DAYS = 30;

// Chrome/Edge fire beforeinstallprompt once per page load, possibly before
// React has mounted anything — so catch it at module load and hand it to
// whichever InstallPrompt is mounted.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(deferredPrompt));

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // suppress the browser's own mini-infobar; we show ours
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

// iPadOS reports itself as a Mac, hence the touch-points check.
function isIOS() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode etc.) — it'll just reappear next visit.
  }
}

// Quiet footer offering to install the app. Android/desktop Chrome & Edge
// get a real one-tap install button; iOS has no install API, so it gets
// Share → Add to Home Screen instructions instead. Hidden when already
// running installed, on browsers that can't install, and for 30 days after
// being dismissed.
export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(deferredPrompt);
  const [hidden, setHidden] = useState(() => isStandalone() || recentlyDismissed());

  useEffect(() => {
    listeners.add(setPromptEvent);
    return () => listeners.delete(setPromptEvent);
  }, []);

  if (hidden) return null;
  const ios = isIOS();
  if (!promptEvent && !ios) return null;

  const dismiss = () => {
    rememberDismissal();
    setHidden(true);
  };

  const install = async () => {
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    deferredPrompt = null;
    setPromptEvent(null);
    if (outcome === "dismissed") dismiss();
  };

  return (
    <div style={styles.installFooter}>
      {promptEvent ? (
        <>
          <span>Add Insight Vault to your home screen</span>
          <button
            style={styles.installBtn}
            onClick={install}
            onMouseEnter={(e) => (e.target.style.background = "#1e4268")}
            onMouseLeave={(e) => (e.target.style.background = "#1a3a5c")}
          >
            install
          </button>
        </>
      ) : (
        <span>
          To install, tap <ShareIcon /> then <span style={{ color: "#b0b6c0" }}>Add to Home Screen</span>
        </span>
      )}
      <button
        style={styles.installDismiss}
        onClick={dismiss}
        onMouseEnter={(e) => (e.target.style.color = "#5a6270")}
        onMouseLeave={(e) => (e.target.style.color = "#3d4350")}
        title="Hide for a month"
        aria-label="Hide for a month"
      >
        ×
      </button>
    </div>
  );
}

// iOS-style share glyph (box with an up arrow).
function ShareIcon() {
  return (
    <svg
      width="13"
      height="15"
      viewBox="0 0 13 15"
      fill="none"
      stroke="#6cb4ee"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-2px", margin: "0 2px" }}
      aria-label="Share"
    >
      <path d="M6.5 1v8.5M3.5 4l3-3 3 3" />
      <path d="M4.5 6.5H2.5a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7.5a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}
