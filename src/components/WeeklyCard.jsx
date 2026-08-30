import { styles } from "../styles.js";

export function WeeklyCard({ entry, onSkip, onAbsorb, isAddedThisWeek }) {
  return (
    <div style={styles.card}>
      {isAddedThisWeek && <span style={styles.addedThisWeek}>added this week</span>}
      {import.meta.env.DEV && <span style={styles.weightBadge}>w:{entry.weight.toFixed(1)}</span>}
      <p style={styles.cardText}>{entry.text}</p>
      {(entry.author || entry.source) && (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#5a6270", marginTop: 10, marginBottom: 0, fontWeight: 400 }}>
          {entry.author && `— ${entry.author}`}{entry.author && entry.source && ", "}{entry.source && <span style={{ fontStyle: "italic", color: "#4a5060" }}>{entry.source}</span>}
        </p>
      )}
      <div style={styles.cardActions}>
        <button
          style={styles.actionBtn("skip")}
          onClick={() => onSkip(entry.id)}
          onMouseEnter={(e) => (e.target.style.background = "#22232e")}
          onMouseLeave={(e) => (e.target.style.background = "#1a1b22")}
        >
          skip · not now
        </button>
        <button
          style={styles.actionBtn("absorb")}
          onClick={() => onAbsorb(entry.id)}
          onMouseEnter={(e) => (e.target.style.background = "#0f3420")}
          onMouseLeave={(e) => (e.target.style.background = "#0d2818")}
        >
          absorbed
        </button>
      </div>
    </div>
  );
}
