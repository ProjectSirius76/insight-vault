import { useEffect, useState } from "react";
import { styles, animationCSS } from "./styles.js";
import { MAX_CHARS, generateId, getWeekId, weightedRandomSelect } from "./helpers.js";
import { useAuth } from "./useAuth.js";
import { useVaultStore, importLegacyVaultData } from "./store.js";
import { SignIn } from "./components/SignIn.jsx";
import { UndoToast } from "./components/UndoToast.jsx";
import { WeeklyCard } from "./components/WeeklyCard.jsx";
import { LibraryEntry } from "./components/LibraryEntry.jsx";
import { ResetAllButton } from "./components/ResetAllButton.jsx";
import { InstallPrompt } from "./components/InstallPrompt.jsx";

function syncErrorMessage(error) {
  if (error.code === "permission-denied") {
    return "Firestore denied the request — the security rules probably haven't been published yet (Firestore Database → Rules in the Firebase console, or `firebase deploy --only firestore:rules`).";
  }
  if (error.code === "unavailable") {
    return "Can't reach Firestore right now — check your connection. Local changes will sync once it's back.";
  }
  if (error.code === "not-found" || (error.message && error.message.includes("does not exist"))) {
    return "No Firestore database found for this project — create one under Build → Firestore Database in the Firebase console.";
  }
  return error.message || String(error);
}

export function SetupNeeded() {
  return (
    <div style={styles.app}>
      <div style={styles.signInScreen}>
        <h1 style={styles.signInTitle}>Insight Vault</h1>
        <p style={styles.signInSubtitle}>
          Firebase isn't configured yet. Copy <code>.env.example</code> to <code>.env.local</code>,
          fill in your Firebase project's web config, and restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, authError, signingIn, signIn, signOut } = useAuth();

  if (user === undefined) {
    return (
      <div style={styles.app}>
        <div style={styles.content}>
          <p style={{ color: "#3d4350", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn onSignIn={signIn} signingIn={signingIn} error={authError} />;
  }

  return <InsightVault user={user} onSignOut={signOut} />;
}

function InsightVault({ user, onSignOut }) {
  const { data, loading, syncError, saveData, saveWithUndo, undoState, handleUndo, dismissUndo, handleResetAll } =
    useVaultStore(user.uid);

  const [view, setView] = useState("weekly");
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newSource, setNewSource] = useState("");

  // DevTools-reachable one-time migration helper — see store.js for usage.
  // Needed because localStorage from the old build doesn't carry over when
  // the site moves to a new (Firebase Hosting) origin.
  useEffect(() => {
    window.insightVaultImport = (jsonString) =>
      importLegacyVaultData(user.uid, jsonString).then((added) => {
        console.log(`Insight Vault: imported ${added} new entr${added === 1 ? "y" : "ies"}.`);
        return added;
      });
    return () => {
      delete window.insightVaultImport;
    };
  }, [user.uid]);

  // Weekly rotation — same logic as the original build, now writing through
  // the Firestore-backed store instead of localStorage.
  useEffect(() => {
    if (!data) return;
    const currentWeekId = getWeekId();
    if (data.currentWeekId !== currentWeekId) {
      const updated = { ...data, entries: data.entries.map((e) => ({ ...e })) };
      if (data.currentWeekId) {
        const prevSelected = new Set(data.weeklySelections || []);
        updated.entries = updated.entries.map((entry) => {
          let w = entry.weight;
          if (prevSelected.has(entry.id) && !entry.skippedThisWeek && !entry.absorbedThisWeek) {
            w -= 3;
          }
          if (!prevSelected.has(entry.id) && !entry.addedThisWeek) {
            w += 0.5;
          }
          w = Math.max(0, Math.min(10, w));
          return { ...entry, weight: w, skippedThisWeek: false, absorbedThisWeek: false, addedThisWeek: false };
        });
      }
      updated.weeklySelections = weightedRandomSelect(updated.entries, 3);
      updated.currentWeekId = currentWeekId;
      saveData(updated);
    }
  }, [data, saveData]);

  const handleSkip = (entryId) => {
    if (!data) return;
    const entry = data.entries.find((e) => e.id === entryId);
    const updated = {
      ...data,
      entries: data.entries.map((e) =>
        e.id === entryId ? { ...e, weight: Math.max(0, e.weight - 1.5), skippedThisWeek: true } : e
      ),
    };
    const remainingPool = updated.entries.filter(
      (e) => e.weight > 0 && !updated.weeklySelections.includes(e.id)
    );
    const replacement = weightedRandomSelect(remainingPool, 1);
    updated.weeklySelections = updated.weeklySelections.map((id) =>
      id === entryId ? (replacement[0] || id) : id
    );
    if (!replacement[0]) {
      updated.weeklySelections = updated.weeklySelections.filter((id) => id !== entryId);
    }
    const preview = entry ? entry.text.slice(0, 40) + (entry.text.length > 40 ? "..." : "") : "entry";
    saveWithUndo(updated, `Skipped "${preview}"`);
  };

  const handleAbsorb = (entryId) => {
    if (!data) return;
    const entry = data.entries.find((e) => e.id === entryId);
    const updated = {
      ...data,
      entries: data.entries.map((e) =>
        e.id === entryId ? { ...e, weight: Math.max(0, e.weight - 5), absorbedThisWeek: true } : e
      ),
    };
    updated.weeklySelections = updated.weeklySelections.filter((id) => id !== entryId);
    const preview = entry ? entry.text.slice(0, 40) + (entry.text.length > 40 ? "..." : "") : "entry";
    saveWithUndo(updated, `Absorbed "${preview}"`);
  };

  const handleAddToWeek = () => {
    if (!newText.trim() || newText.length > MAX_CHARS) return;
    const newEntry = {
      id: generateId(),
      text: newText.trim(),
      author: newAuthor.trim(),
      source: newSource.trim(),
      weight: 10,
      createdAt: Date.now(),
      addedThisWeek: true,
    };
    saveData({
      ...data,
      entries: [...data.entries, newEntry],
      weeklySelections: [...data.weeklySelections, newEntry.id],
    });
    setNewText("");
    setNewAuthor("");
    setNewSource("");
  };

  const handleAddToLibrary = () => {
    if (!newText.trim() || newText.length > MAX_CHARS) return;
    const newEntry = {
      id: generateId(),
      text: newText.trim(),
      author: newAuthor.trim(),
      source: newSource.trim(),
      weight: 10,
      createdAt: Date.now(),
    };
    saveData({ ...data, entries: [...data.entries, newEntry] });
    setNewText("");
    setNewAuthor("");
    setNewSource("");
  };

  const handleAddExistingToWeek = (entryId) => {
    if (!data) return;
    const filtered = data.weeklySelections.filter((id) => id !== entryId);
    saveData({ ...data, weeklySelections: [...filtered, entryId] });
  };

  const handleResetWeight = (entryId) => {
    if (!data) return;
    saveData({
      ...data,
      entries: data.entries.map((e) => (e.id === entryId ? { ...e, weight: 10 } : e)),
    });
  };

  const handleDelete = (entryId) => {
    saveData({
      ...data,
      entries: data.entries.filter((e) => e.id !== entryId),
      weeklySelections: data.weeklySelections.filter((id) => id !== entryId),
    });
  };

  const handleEdit = (entryId, newTextVal, newAuthorVal, newSourceVal) => {
    saveData({
      ...data,
      entries: data.entries.map((e) => (e.id === entryId ? { ...e, text: newTextVal, author: newAuthorVal, source: newSourceVal } : e)),
    });
  };

  if (syncError) {
    return (
      <div style={styles.app}>
        <div style={styles.content}>
          <p style={{ color: "#e05252", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.6 }}>
            Sync error: {syncErrorMessage(syncError)}
          </p>
          <button style={styles.signOutBtn} onClick={onSignOut}>
            sign out
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={styles.app}>
        <div style={styles.content}>
          <p style={{ color: "#3d4350", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>syncing...</p>
        </div>
      </div>
    );
  }

  const weeklyEntries = data.weeklySelections.map((id) => data.entries.find((e) => e.id === id)).filter(Boolean);
  const weeklyIdSet = new Set(data.weeklySelections);
  const sortedLibrary = [...data.entries].sort((a, b) => b.weight - a.weight);
  const nextSunday = new Date();
  const daysUntilSunday = (7 - nextSunday.getDay()) % 7 || 7;

  return (
    <div style={styles.app}>
      <style>{animationCSS}</style>
      <div style={styles.grain} />
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Insight Vault</h1>
              <p style={styles.subtitle}>{data.entries.length} entries · rotates every Sunday</p>
            </div>
            <div style={styles.accountRow}>
              {user.photoURL && <img src={user.photoURL} alt="" style={styles.avatar} />}
              <button style={styles.signOutBtn} onClick={onSignOut}>
                sign out
              </button>
            </div>
          </div>
        </div>

        <div style={styles.nav}>
          <button style={styles.navButton(view === "weekly")} onClick={() => setView("weekly")}>
            This Week
          </button>
          <button style={styles.navButton(view === "library")} onClick={() => setView("library")}>
            Library
          </button>
        </div>

        {view === "weekly" && (
          <div style={{ marginTop: 32 }}>
            <div style={styles.weekInfo}>
              <span style={styles.weekLabel}>Week of {data.currentWeekId}</span>
              <span style={styles.weekLabel}>
                {daysUntilSunday === 7 ? "rotates today" : `${daysUntilSunday}d until rotation`}
              </span>
            </div>
            {weeklyEntries.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>Nothing this week</div>
                <p style={{ fontSize: 14 }}>
                  All entries are cooling down, or the library is empty. Add some from the Library tab.
                </p>
              </div>
            ) : (
              weeklyEntries.map((entry) => (
                <WeeklyCard
                  key={entry.id}
                  entry={entry}
                  onSkip={handleSkip}
                  onAbsorb={handleAbsorb}
                  isAddedThisWeek={entry.addedThisWeek}
                />
              ))
            )}
          </div>
        )}

        {view === "library" && (
          <div style={{ marginTop: 32 }}>
            <div style={styles.addSection}>
              <label style={styles.addLabel}>Add new insight</label>
              <textarea
                style={styles.textarea}
                placeholder="Something worth remembering..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                maxLength={MAX_CHARS}
                onFocus={(e) => (e.target.style.borderColor = "#2a3a5c")}
                onBlur={(e) => (e.target.style.borderColor = "#1e2028")}
              />
              <div style={styles.charCount(newText.length > MAX_CHARS)}>{newText.length}/{MAX_CHARS}</div>
              <input
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "1px solid #1e2028",
                  borderRadius: 8,
                  background: "#0d0e14",
                  color: "#c8ccd4",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 400,
                  outline: "none",
                  boxSizing: "border-box",
                  marginTop: 10,
                  transition: "border-color 0.2s ease",
                }}
                placeholder="Author (optional)"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value.slice(0, 50))}
                maxLength={50}
                onFocus={(e) => (e.target.style.borderColor = "#2a3a5c")}
                onBlur={(e) => (e.target.style.borderColor = "#1e2028")}
              />
              <input
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "1px solid #1e2028",
                  borderRadius: 8,
                  background: "#0d0e14",
                  color: "#c8ccd4",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 400,
                  fontStyle: "italic",
                  outline: "none",
                  boxSizing: "border-box",
                  marginTop: 6,
                  transition: "border-color 0.2s ease",
                }}
                placeholder="Source (optional) e.g. Atomic Habits, 2018"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value.slice(0, 100))}
                maxLength={100}
                onFocus={(e) => (e.target.style.borderColor = "#2a3a5c")}
                onBlur={(e) => (e.target.style.borderColor = "#1e2028")}
              />
              {newText.trim() && (
                <div style={styles.addButtons}>
                  <button style={styles.addBtn(true)} onClick={handleAddToWeek}>add to this week</button>
                  <button style={styles.addBtn(false)} onClick={handleAddToLibrary}>add to library</button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
                <span style={styles.weekLabel}>{data.entries.length} entries</span>
                <span style={styles.weekLabel}>weight</span>
              </div>
              {sortedLibrary.map((entry) => (
                <LibraryEntry
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onAddToWeek={handleAddExistingToWeek}
                  onResetWeight={handleResetWeight}
                  isInWeek={weeklyIdSet.has(entry.id)}
                />
              ))}
            </div>
          </div>
        )}

        <InstallPrompt />
      </div>

      {undoState && (
        <UndoToast
          key={undoState.message}
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      )}

      <ResetAllButton onReset={handleResetAll} />
    </div>
  );
}
