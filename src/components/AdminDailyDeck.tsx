import { useEffect, useMemo, useState } from "preact/hooks";
import {
  autoPickAdminDailyDeck,
  clearAdminDailyDeck,
  fetchAdminDailyDeck,
  publishAdminDailyDeck
} from "../services/api";
import type { AdminDailyDeckState, AdminRosterOption } from "../types";

const ADMIN_TOKEN_KEY = "sorsorrank-admin-token";

function getBangkokDateInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function AdminDailyDeck() {
  const [adminToken, setAdminToken] = useState(() => window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const [date, setDate] = useState(getBangkokDateInputValue);
  const [deckState, setDeckState] = useState<AdminDailyDeckState | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving">("idle");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const rosterById = useMemo(() => {
    return new Map((deckState?.roster ?? []).map((item) => [item.id, item]));
  }, [deckState]);

  const filteredRoster = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (deckState?.roster ?? [])
      .filter((item) => !selectedIds.includes(item.id))
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return [item.displayName, item.roleLabel, item.partyLabel, item.searchQuery]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .slice(0, 40);
  }, [deckState, query, selectedIds]);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    void loadDeck();
  }, [date]);

  async function loadDeck() {
    if (!adminToken) {
      setErrorMessage("Enter the admin token first.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setMessage("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      const nextState = await fetchAdminDailyDeck(adminToken, date);
      setDeckState(nextState);
      setSelectedIds(nextState.cards.map((card) => card.politicianId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin deck could not load.");
    } finally {
      setStatus("idle");
    }
  }

  async function saveManualDeck() {
    setStatus("saving");
    setErrorMessage("");
    setMessage("");

    try {
      const nextState = await publishAdminDailyDeck(adminToken, date, selectedIds);
      setDeckState(nextState);
      setSelectedIds(nextState.cards.map((card) => card.politicianId));
      setMessage("Daily Deck published.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Daily Deck could not be published.");
    } finally {
      setStatus("idle");
    }
  }

  async function autoPickDeck() {
    setStatus("saving");
    setErrorMessage("");
    setMessage("");

    try {
      const nextState = await autoPickAdminDailyDeck(adminToken, date);
      setDeckState(nextState);
      setSelectedIds(nextState.cards.map((card) => card.politicianId));
      setMessage("Auto-pick published.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Auto-pick failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function clearDeck() {
    setStatus("saving");
    setErrorMessage("");
    setMessage("");

    try {
      const nextState = await clearAdminDailyDeck(adminToken, date);
      setDeckState(nextState);
      setSelectedIds([]);
      setMessage("Future Daily Deck cleared.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Daily Deck could not be cleared.");
    } finally {
      setStatus("idle");
    }
  }

  function addRosterItem(item: AdminRosterOption) {
    if (selectedIds.includes(item.id) || selectedIds.length >= 10) {
      return;
    }

    setSelectedIds((current) => [...current, item.id]);
  }

  function removeSelected(id: string) {
    setSelectedIds((current) => current.filter((candidate) => candidate !== id));
  }

  function moveSelected(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      return next;
    });
  }

  const isBusy = status !== "idle";
  const canClear = Boolean(deckState && date > deckState.today && selectedIds.length > 0);

  return (
    <section class="admin-shell">
      <div class="admin-header">
        <div>
          <p class="panel-label">Admin</p>
          <h1>Daily Deck selection</h1>
          <p class="panel-meta">Pick the shared cards for any Thailand calendar date.</p>
        </div>
        <div class="admin-controls">
          <input
            class="admin-input admin-token-input"
            type="password"
            value={adminToken}
            placeholder="Admin token"
            onInput={(event) => setAdminToken((event.currentTarget as HTMLInputElement).value)}
          />
          <input
            class="admin-input"
            type="date"
            value={date}
            onInput={(event) => setDate((event.currentTarget as HTMLInputElement).value)}
          />
          <button class="ghost-cta" type="button" onClick={loadDeck} disabled={isBusy}>
            Refresh
          </button>
        </div>
      </div>

      {errorMessage ? <p class="inline-error admin-message">{errorMessage}</p> : null}
      {message ? <p class="admin-success admin-message">{message}</p> : null}

      <div class="admin-grid">
        <section class="panel admin-panel">
          <div class="admin-section-heading">
            <div>
              <h2>Selected cards</h2>
              <p>{selectedIds.length}/10 shared cards</p>
            </div>
            <div class="admin-action-row">
              <button class="ghost-cta" type="button" onClick={autoPickDeck} disabled={isBusy || !adminToken}>
                Auto-pick 10
              </button>
              <button class="primary-cta" type="button" onClick={saveManualDeck} disabled={isBusy || selectedIds.length === 0}>
                Publish selected
              </button>
            </div>
          </div>

          {selectedIds.length === 0 ? (
            <div class="admin-empty">No cards selected for this date.</div>
          ) : (
            <ol class="admin-selected-list">
              {selectedIds.map((id, index) => {
                const item = rosterById.get(id) ?? deckState?.cards.find((card) => card.politicianId === id);
                return (
                  <li class="admin-selected-item" key={id}>
                    <span class="admin-position">{index + 1}</span>
                    {item?.imageUrl ? <img class="admin-avatar" src={item.imageUrl} alt="" /> : <span class="admin-avatar admin-avatar-fallback" />}
                    <div class="admin-item-copy">
                      <strong>{item?.displayName ?? id}</strong>
                      <span>{[item?.roleLabel, item?.partyLabel].filter(Boolean).join(" · ") || "Active roster"}</span>
                    </div>
                    <div class="admin-row-actions">
                      <button type="button" onClick={() => moveSelected(id, -1)} disabled={index === 0 || isBusy}>Up</button>
                      <button type="button" onClick={() => moveSelected(id, 1)} disabled={index === selectedIds.length - 1 || isBusy}>Down</button>
                      <button type="button" onClick={() => removeSelected(id)} disabled={isBusy}>Remove</button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <button class="text-link-button admin-clear-button" type="button" onClick={clearDeck} disabled={isBusy || !canClear}>
            Clear future deck
          </button>
        </section>

        <section class="panel admin-panel">
          <div class="admin-section-heading">
            <div>
              <h2>Active roster</h2>
              <p>{deckState?.roster.length ?? 0} available rows</p>
            </div>
          </div>

          <input
            class="admin-input admin-search"
            type="search"
            value={query}
            placeholder="Search roster"
            onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
          />

          {status === "loading" ? <div class="admin-empty">Loading roster...</div> : null}
          {status !== "loading" && filteredRoster.length === 0 ? <div class="admin-empty">No matching active roster rows.</div> : null}

          <div class="admin-roster-list">
            {filteredRoster.map((item) => (
              <button class="admin-roster-item" type="button" key={item.id} onClick={() => addRosterItem(item)} disabled={isBusy || selectedIds.length >= 10}>
                {item.imageUrl ? <img class="admin-avatar" src={item.imageUrl} alt="" /> : <span class="admin-avatar admin-avatar-fallback" />}
                <span>
                  <strong>{item.displayName}</strong>
                  <small>{[item.roleLabel, item.partyLabel].filter(Boolean).join(" · ") || item.searchQuery}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
