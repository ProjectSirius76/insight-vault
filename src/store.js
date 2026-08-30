import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { createSeedData } from "./helpers.js";

const LEGACY_LOCALSTORAGE_KEY = "insight-vault-data";

function vaultDocRef(uid) {
  return doc(db, "vaults", uid);
}

// One-time import from the old localStorage-only build, if this browser has
// data sitting in it and Firestore doesn't have a vault for this user yet.
function readLegacyLocalData() {
  try {
    const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Firestore-backed replacement for the old window.storage shim. Subscribes
// to /vaults/{uid} in real time so changes made on one signed-in device
// show up on every other one automatically, and relies on Firestore's own
// persistent local cache for instant, offline-tolerant reads/writes.
export function useVaultStore(uid) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [undoState, setUndoState] = useState(null);
  const dataRef = useRef(null);
  dataRef.current = data;

  useEffect(() => {
    if (!uid) {
      setData(null);
      setLoading(true);
      return;
    }
    setLoading(true);
    setSyncError(null);
    const ref = vaultDocRef(uid);
    let initialized = false;

    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      async (snap) => {
        if (snap.exists()) {
          setData(snap.data());
          setLoading(false);
          setSyncError(null);
          initialized = true;
        } else if (!initialized) {
          // No vault yet for this account. Prefer this browser's legacy
          // localStorage data (from the pre-sync build) over fresh seed
          // data, so nothing gets lost in the migration.
          initialized = true;
          try {
            const legacy = readLegacyLocalData();
            const seed = legacy && Array.isArray(legacy.entries) ? legacy : createSeedData();
            await setDoc(ref, seed);
            // onSnapshot fires again once the write lands in the local cache.
          } catch (e) {
            console.error("Vault init failed:", e);
            initialized = false;
            setLoading(false);
            setSyncError(e);
          }
        }
      },
      (error) => {
        console.error("Vault sync error:", error);
        setLoading(false);
        setSyncError(error);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const saveData = useCallback(
    async (newData) => {
      if (!uid) return;
      setData(newData);
      try {
        await setDoc(vaultDocRef(uid), newData);
      } catch (e) {
        console.error("Vault save failed:", e);
      }
    },
    [uid]
  );

  const saveWithUndo = useCallback(
    (newData, message) => {
      const snapshot = JSON.parse(JSON.stringify(dataRef.current));
      setUndoState({ message, snapshot });
      saveData(newData);
    },
    [saveData]
  );

  const handleUndo = useCallback(() => {
    if (undoState && undoState.snapshot) {
      saveData(undoState.snapshot);
      setUndoState(null);
    }
  }, [undoState, saveData]);

  const dismissUndo = useCallback(() => setUndoState(null), []);

  const handleResetAll = useCallback(async () => {
    if (!uid) return;
    const fresh = createSeedData();
    setData(fresh);
    await setDoc(vaultDocRef(uid), fresh);
  }, [uid]);

  return { data, loading, syncError, saveData, saveWithUndo, undoState, handleUndo, dismissUndo, handleResetAll };
}

export async function deleteVault(uid) {
  await deleteDoc(vaultDocRef(uid));
}

// Manual migration path for data that can't be picked up automatically —
// e.g. the browser's localStorage is on a different origin than the new
// Firebase-hosted site. Merges by text (skips anything already present) so
// it's safe to run more than once. Exposed on window as
// `insightVaultImport` (see App.jsx) so it's reachable from DevTools:
//   copy(localStorage.getItem("insight-vault-data"))   // on the OLD site
//   insightVaultImport(`<paste>`)                      // on the NEW site, signed in
export async function importLegacyVaultData(uid, jsonString) {
  const legacy = JSON.parse(jsonString);
  if (!legacy || !Array.isArray(legacy.entries)) {
    throw new Error(
      "That doesn't look like Insight Vault data — expected an object with an `entries` array."
    );
  }
  const ref = vaultDocRef(uid);
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data() : createSeedData();
  const existingTexts = new Set(current.entries.map((e) => e.text));
  const merged = [...current.entries];
  let added = 0;
  for (const entry of legacy.entries) {
    if (!existingTexts.has(entry.text)) {
      merged.push(entry);
      added++;
    }
  }
  await setDoc(ref, { ...current, entries: merged });
  return added;
}
