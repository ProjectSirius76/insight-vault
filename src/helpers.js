// Pure helpers shared across the app. Ported unchanged from the original
// single-file build — the rotation/weighting logic is not part of this
// migration, only where the data lives.

export const MAX_CHARS = 500;
export const UNDO_TIMEOUT = 4000;

export function getWeekId(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().slice(0, 10);
}

export function weightedRandomSelect(entries, count) {
  const pool = entries.filter((e) => e.weight > 0);
  const selected = [];
  const usedIds = new Set();

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) break;
    let rand = Math.random() * totalWeight;
    let chosen = null;
    for (const entry of pool) {
      rand -= entry.weight;
      if (rand <= 0) {
        chosen = entry;
        break;
      }
    }
    if (chosen && !usedIds.has(chosen.id)) {
      selected.push(chosen.id);
      usedIds.add(chosen.id);
      pool.splice(pool.indexOf(chosen), 1);
    }
  }
  return selected;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Keeps an existing vault in sync with newly-added default quotes, and fills
// in author/source fields for entries that predate those fields. Ported
// from the legacy build's load()-time migration pass (which ran against
// localStorage on every load) — same logic, just returned instead of
// mutated in place, so the caller decides whether/how to persist it.
// Idempotent: once an entry has author/source and every seed text is
// present, a second call is a no-op (needsSave: false).
export function backfillEntries(data) {
  let needsSave = false;
  const seedEntries = createSeedData().entries;

  const entries = data.entries.map((entry) => {
    if (entry.author === undefined || entry.source === undefined) {
      needsSave = true;
      const seedMatch = seedEntries.find((s) => s.text === entry.text);
      return {
        ...entry,
        author: entry.author !== undefined ? entry.author : seedMatch ? seedMatch.author : "",
        source: entry.source !== undefined ? entry.source : seedMatch ? seedMatch.source : "",
      };
    }
    return entry;
  });

  const existingTexts = new Set(entries.map((e) => e.text));
  for (const seed of seedEntries) {
    if (!existingTexts.has(seed.text)) {
      entries.push(seed);
      needsSave = true;
    }
  }

  return needsSave ? { data: { ...data, entries }, needsSave } : { data, needsSave };
}

export function createSeedData() {
  return {
    entries: [
      {
        id: generateId(),
        text: "People who bear no consequences for being wrong develop systematically distorted models of reality compared to practitioners who get immediate feedback from the real world.",
        author: "Claude",
        source: "Conversation with user",
        weight: 10,
        createdAt: Date.now(),
      },
      {
        id: generateId(),
        text: "The map is not the territory. Every model omits something, and what it omits is often what matters most in edge cases.",
        author: "Alfred Korzybski",
        source: "Science and Sanity, 1933",
        weight: 8,
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: generateId(),
        text: "Complexity that serves no purpose is indistinguishable from incompetence. Simplicity earned through deep understanding is the highest form of sophistication.",
        author: "Claude",
        source: "Conversation with user",
        weight: 10,
        createdAt: Date.now() - 86400000 * 7,
      },
      {
        id: generateId(),
        text: "You don't rise to the level of your goals. You fall to the level of your systems.",
        author: "James Clear",
        source: "Atomic Habits, 2018",
        weight: 6,
        createdAt: Date.now() - 86400000 * 14,
      },
      {
        id: generateId(),
        text: "The bottleneck is almost never where you think it is. Measure before you optimise, or you'll build a faster road to nowhere.",
        author: "Claude",
        source: "Conversation with user",
        weight: 10,
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: generateId(),
        text: "Strong opinions, weakly held is misunderstood. It means update aggressively when evidence arrives, not perform confidence as a personality trait.",
        author: "Paul Saffo",
        source: "",
        weight: 4,
        createdAt: Date.now() - 86400000 * 21,
      },
      {
        id: generateId(),
        text: "I am a child of Earth and starry Heaven, but my race is heavenly. I am parched with thirst and perishing — give me quickly the cold water flowing from the Lake of Memory.",
        author: "Unknown",
        source: "Orphic gold tablet, Petelia, c. 4th century BCE",
        weight: 10,
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: generateId(),
        text: "The specific failure mode of solo deep work isn't doing it wrong technically, it's losing perspective on what you're optimizing for.",
        author: "Claude",
        source: "Conversation with user",
        weight: 10,
        createdAt: Date.now() - 86400000 * 1,
      },
    ],
    weeklySelections: [],
    currentWeekId: null,
    lastTickWeekId: null,
  };
}
