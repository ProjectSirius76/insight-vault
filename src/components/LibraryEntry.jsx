import { useState } from "react";
import { styles } from "../styles.js";
import { MAX_CHARS } from "../helpers.js";

export function LibraryEntry({ entry, onDelete, onEdit, onAddToWeek, onResetWeight }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [editAuthor, setEditAuthor] = useState(entry.author || "");
  const [editSource, setEditSource] = useState(entry.source || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (editText.trim() && editText.length <= MAX_CHARS) {
      onEdit(entry.id, editText.trim(), editAuthor.trim(), editSource.trim());
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(entry.text);
    setEditAuthor(entry.author || "");
    setEditSource(entry.source || "");
    setEditing(false);
  };

  const weightColor =
    entry.weight >= 7 ? "#6cb4ee" : entry.weight >= 4 ? "#f0b232" : entry.weight > 0 ? "#e07850" : "#e05252";

  return (
    <div>
      <div style={styles.libraryEntry}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div>
              <textarea
                style={styles.editTextarea}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={MAX_CHARS}
              />
              <input
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #2a2d38",
                  borderRadius: 5,
                  background: "#0d0e14",
                  color: "#c8ccd4",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 400,
                  outline: "none",
                  boxSizing: "border-box",
                  marginTop: 6,
                }}
                placeholder="Author (optional)"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value.slice(0, 50))}
                maxLength={50}
              />
              <input
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #2a2d38",
                  borderRadius: 5,
                  background: "#0d0e14",
                  color: "#c8ccd4",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 400,
                  fontStyle: "italic",
                  outline: "none",
                  boxSizing: "border-box",
                  marginTop: 4,
                }}
                placeholder="Source (optional)"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value.slice(0, 100))}
                maxLength={100}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button style={styles.smallBtn("#6cb4ee")} onClick={handleSave}>
                  save
                </button>
                <button style={styles.smallBtn("#5a6270")} onClick={handleCancel}>
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.libraryText}>
              {entry.text}
              {(entry.author || entry.source) && (
                <span style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5a6270", marginTop: 4 }}>
                  {entry.author && `— ${entry.author}`}{entry.author && entry.source && ", "}{entry.source && <span style={{ fontStyle: "italic", color: "#4a5060" }}>{entry.source}</span>}
                </span>
              )}
            </div>
          )}
        </div>
        <div style={styles.libraryWeight}>
          <span style={{ color: weightColor }}>{entry.weight.toFixed(1)}</span>
        </div>
        <div style={styles.libraryActions}>
          {!editing && (
            <>
              <button
                style={styles.smallBtn("#3ddc84")}
                onClick={() => onAddToWeek(entry.id)}
                title="Add to this week"
              >
                +
              </button>
              {entry.weight < 10 && (
                <button
                  style={styles.smallBtn("#f0b232")}
                  onClick={() => onResetWeight(entry.id)}
                  title="Reset weight to 10"
                >
                  ↻
                </button>
              )}
              <button style={styles.smallBtn("#5a6270")} onClick={() => setEditing(true)}>
                edit
              </button>
              <button style={styles.smallBtn("#e05252")} onClick={() => setConfirmDelete(true)}>
                ×
              </button>
            </>
          )}
        </div>
      </div>
      {confirmDelete && (
        <div style={styles.deleteConfirm}>
          <span style={{ fontSize: 12, color: "#e05252" }}>delete permanently?</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={{ ...styles.smallBtn("#e05252"), background: "#2a0a0a", borderRadius: 5, padding: "4px 10px" }}
              onClick={() => {
                onDelete(entry.id);
                setConfirmDelete(false);
              }}
            >
              yes, delete
            </button>
            <button style={styles.smallBtn("#5a6270")} onClick={() => setConfirmDelete(false)}>
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
