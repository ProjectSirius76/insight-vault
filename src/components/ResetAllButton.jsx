import { useEffect, useRef, useState } from "react";
import { styles } from "../styles.js";

// Subtle reset-all-data control. Two-step confirm to avoid fat-finger wipes.
export function ResetAllButton({ onReset }) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (armed) {
      timerRef.current = setTimeout(() => setArmed(false), 5000);
      return () => clearTimeout(timerRef.current);
    }
  }, [armed]);

  if (!armed) {
    return (
      <button
        style={styles.resetLink}
        onMouseEnter={(e) => (e.target.style.color = "#5a6270")}
        onMouseLeave={(e) => (e.target.style.color = "#2a2d38")}
        onClick={() => setArmed(true)}
        title="Reset all data — wipes your vault"
      >
        reset
      </button>
    );
  }
  return (
    <button
      style={{ ...styles.resetLink, color: "#e05252" }}
      onClick={() => {
        clearTimeout(timerRef.current);
        onReset();
        setArmed(false);
      }}
    >
      tap again to wipe
    </button>
  );
}
