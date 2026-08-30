import { useEffect, useRef, useState } from "react";
import { styles } from "../styles.js";
import { UNDO_TIMEOUT } from "../helpers.js";

export function UndoToast({ message, onUndo, onDismiss }) {
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(onDismiss, 300);
    }, UNDO_TIMEOUT);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  const handleUndo = () => {
    clearTimeout(timerRef.current);
    onUndo();
  };

  return (
    <div
      style={{
        ...styles.undoToast,
        ...(fading ? { animation: "fadeOut 0.3s ease-out forwards" } : {}),
      }}
    >
      <span style={styles.undoText}>{message}</span>
      <button
        style={styles.undoBtn}
        onClick={handleUndo}
        onMouseEnter={(e) => (e.target.style.background = "#1a3a5c")}
        onMouseLeave={(e) => (e.target.style.background = "transparent")}
      >
        undo
      </button>
    </div>
  );
}
