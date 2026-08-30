import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";

function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true // iOS Safari's older flag
  );
}

// Popup by default: reliable in a normal browser tab, and errors surface
// immediately instead of depending on state surviving a full page redirect
// out to Google and back (which is the part that's fragile, especially on
// localhost). Redirect is used only when the app is actually running
// installed/standalone, where there's no window chrome for a popup to open
// in — the one case popups genuinely don't work.
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = not yet known, null = signed out
  const [authError, setAuthError] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((e) => {
      console.error("Sign-in redirect failed:", e);
      setAuthError(e.message || "Sign-in failed");
    });
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) setSigningIn(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);

    if (isStandalone()) {
      signInWithRedirect(auth, googleProvider).catch((e) => {
        console.error("Sign-in failed:", e);
        setAuthError(e.message || "Sign-in failed");
        setSigningIn(false);
      });
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged above picks up the result and clears signingIn.
    } catch (e) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
        // Browser wouldn't allow the popup — fall back to redirect.
        signInWithRedirect(auth, googleProvider).catch((e2) => {
          console.error("Sign-in failed:", e2);
          setAuthError(e2.message || "Sign-in failed");
          setSigningIn(false);
        });
        return;
      }
      if (e.code !== "auth/cancelled-popup-request" && e.code !== "auth/popup-closed-by-user") {
        console.error("Sign-in failed:", e);
        setAuthError(e.message || "Sign-in failed");
      }
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  return { user, authError, signingIn, signIn, signOut };
}
