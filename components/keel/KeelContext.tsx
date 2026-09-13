"use client";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/convex/_generated/api";
import { useKeelSession } from "@/components/app/useKeelSession";
import type { Turn } from "@/lib/dashboard/model";
import { migrateProfile, nextStep, type Profile } from "@/lib/onboarding/questions";
import { sampleProfile } from "@/lib/dashboard/sample";
import type { KeelAskContext } from "@/lib/dashboard/api";
import type { AttachedAsset } from "./keelDnd";
import type { AnalyzedAsset } from "@/lib/dashboard/analyzedAsset";

export type PageContext =
  | { page: "dashboard"; categoryId: string }
  | { page: "asset"; assetId: string }
  | { page: "none" };

export type KeelReply = { text: string; sourceIds: string[]; id: string; action: string };

type KeelState = {
  sessionId: string | null;
  demo: boolean;
  isLoaded: boolean;
  profile: Profile | null;
  hasProfile: boolean;
  revision: number;
  savedAssets: string[];
  analyzedAssets: AnalyzedAsset[];
  open: boolean;
  busy: boolean;
  lastReply: KeelReply | null;
  error: string;
  notice: string;
  attached: AttachedAsset[];
  pageContext: PageContext;
  turns: Turn[];
  dragging: boolean;
  dragOver: boolean;
  paused: boolean;
  unread: boolean;
  quickAsks: string[];
  /** Live text selection on the page, if any — what "explain this" acts on. */
  selection: string;
  /** Buddy position, px offsets from its default corner. */
  pos: { x: number; y: number };
};
type KeelApi = {
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setPageContext: (ctx: PageContext) => void;
  attach: (asset: AttachedAsset) => void;
  detach: (id: string) => void;
  clearAttached: () => void;
  /** `note` rides the request's `context.note`, already plumbed to the prompt. */
  ask: (question: string, note?: string) => Promise<void>;
  /** `open` false speaks through the bubble without opening the query box. */
  say: (text: string, open?: boolean) => void;
  setPos: (pos: { x: number; y: number }) => void;
  newConversation: () => Promise<void>;
  setDragOver: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  toggleSaved: (assetId: string) => Promise<void>;
  withDemo: (href: string) => string;
};

const KeelCtx = createContext<(KeelState & KeelApi) | null>(null);
const OPEN_KEY = "keel-overlay-open";
const PAUSE_KEY = "keel-motion-paused";
const POS_KEY = "keel-buddy-pos";
const MAX_NOTE = 300;
const MAX_ATTACHED = 4;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function KeelProvider({ children }: { children: ReactNode }) {
  const session = useKeelSession();
  const { sessionId, demo, withDemo } = session;
  const profileDoc = useQuery(
    api.profiles.getBySession,
    sessionId && !demo ? { sessionId } : "skip",
  );
  const newConversationMutation = useMutation(api.profiles.newConversation);
  const toggleSavedMutation = useMutation(api.profiles.toggleSaved);

  const profile = useMemo<Profile | null>(() => {
    if (demo) return sampleProfile;
    if (!profileDoc) return null;
    return migrateProfile(profileDoc.profileV3 ?? profileDoc.profileV2 ?? profileDoc.answers);
  }, [demo, profileDoc]);
  const revision = profileDoc?.revision ?? 0;

  const [open, setOpenState] = useState(false);
  const [paused, setPausedState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState<KeelReply | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attached, setAttached] = useState<AttachedAsset[]>([]);
  const [pageContext, setPageContextState] = useState<PageContext>({ page: "none" });
  const [localTurns, setLocalTurns] = useState<Turn[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [unread, setUnread] = useState(false);
  const [sampleSaved, setSampleSaved] = useState<string[]>([]);
  const [selection, setSelection] = useState("");
  const [pos, setPosState] = useState({ x: 0, y: 0 });
  const interaction = useRef(0);
  const requestId = useRef<{ id: string; key: string } | null>(null);

  useEffect(() => {
    // Persisted UI preferences are read after mount to keep hydration stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists on the client.
    setOpenState(read(OPEN_KEY) === "1");
    setPausedState(read(PAUSE_KEY) === "1");
    const raw = read(POS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { x: number; y: number };
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") setPosState(parsed);
      } catch {
        /* a corrupt value just means the default corner */
      }
    }
  }, []);

  // The page selection is what "press me to learn more" explains. Reading it on
  // a debounce keeps a drag-select from firing on every intermediate range.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const text = window.getSelection()?.toString().trim() ?? "";
        // Ignore selections inside the buddy itself, or the reply it just gave.
        setSelection(text.length > 1 ? text.slice(0, MAX_NOTE) : "");
      }, 180);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
    };
  }, []);
  useEffect(() => {
    const start = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("application/x-keel-asset"))
        setDragging(true);
    };
    const end = () => {
      setDragging(false);
      setDragOver(false);
    };
    document.addEventListener("dragstart", start);
    document.addEventListener("dragend", end);
    document.addEventListener("drop", end);
    return () => {
      document.removeEventListener("dragstart", start);
      document.removeEventListener("dragend", end);
      document.removeEventListener("drop", end);
    };
  }, []);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    write(OPEN_KEY, value ? "1" : "0");
    if (value) setUnread(false);
  }, []);
  const setPaused = useCallback((value: boolean) => {
    setPausedState(value);
    write(PAUSE_KEY, value ? "1" : "0");
  }, []);
  const setPageContext = useCallback((ctx: PageContext) => {
    setPageContextState(ctx);
    setError("");
    setNotice("");
  }, []);
  const attach = useCallback((asset: AttachedAsset) => {
    setAttached((list) => {
      if (list.some((a) => a.id === asset.id))
        return list.map((a) => (a.id === asset.id ? { ...a, locked: a.locked || asset.locked } : a));
      const next = [...list, asset];
      // Keep locked chips; drop the oldest unlocked one when over the limit.
      while (next.length > MAX_ATTACHED) {
        const index = next.findIndex((a) => !a.locked);
        if (index < 0) break;
        next.splice(index, 1);
      }
      return next;
    });
    setNotice(`Attached ${asset.ticker}. Ask Keel about it.`);
  }, []);
  const detach = useCallback((id: string) => {
    setAttached((list) => list.filter((a) => a.id !== id));
  }, []);
  const clearAttached = useCallback(() => setAttached((list) => list.filter((a) => a.locked)), []);

  const turns = useMemo<Turn[]>(() => {
    const remote = profileDoc?.conversation ?? [];
    return [...remote, ...localTurns.filter((t) => !remote.some((r) => r.id === t.id))];
  }, [profileDoc?.conversation, localTurns]);

  const setPos = useCallback((next: { x: number; y: number }) => {
    setPosState(next);
    write(POS_KEY, JSON.stringify(next));
  }, []);

  const say = useCallback(
    (text: string, open = true) => {
      setLastReply({ text, sourceIds: [], id: crypto.randomUUID(), action: "none" });
      if (open) setOpen(true);
    },
    [setOpen],
  );

  const ask = useCallback(
    async (question: string, note?: string) => {
      const text = question.trim();
      if (!text || busy) return;
      interaction.current += 1;
      const at = interaction.current;
      setError("");
      setNotice("");
      setOpen(true);
      if (demo || !sessionId) {
        const reply = text.toLowerCase().includes("risk")
          ? "In this example the prices are made up, so the risk numbers only show the idea. Add your own answers to ask about real data."
          : "This is an example dashboard. Open any option to see how Keel explains it. Add your goals to ask real questions.";
        const turn: Turn = { id: crypto.randomUUID(), question: text, reply, action: "none", sourceIds: [] };
        setLastReply({ text: reply, sourceIds: [], id: turn.id, action: "none" });
        setLocalTurns((t) => [...t, turn]);
        return;
      }
      const trimmedNote = note?.trim().slice(0, MAX_NOTE) || undefined;
      const base: KeelAskContext =
        pageContext.page === "asset"
          ? { page: `asset:${pageContext.assetId}`, assetIds: attached.map((a) => a.id) }
          : pageContext.page === "dashboard"
            ? { page: "dashboard", categoryId: pageContext.categoryId, assetIds: attached.map((a) => a.id) }
            : { page: "dashboard", assetIds: attached.map((a) => a.id) };
      const context: KeelAskContext = trimmedNote ? { ...base, note: trimmedNote } : base;
      const key = `${text}|${JSON.stringify(context)}`;
      if (requestId.current?.key !== key) requestId.current = { id: crypto.randomUUID(), key };
      setBusy(true);
      try {
        const response = await fetch("/api/keel-ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            requestId: requestId.current.id,
            question: text,
            mode: "ask",
            context,
          }),
        });
        const reply = await response.json();
        if (!response.ok) {
          requestId.current = null;
          throw new Error(reply.error ?? "I couldn't answer that. Please try again.");
        }
        const sourceIds: string[] = Array.isArray(reply.sourceIds) ? reply.sourceIds : [];
        if (interaction.current === at) {
          setLastReply({ text: reply.text, sourceIds, id: reply.id, action: reply.action });
          if (reply.action === "profile")
            setNotice("You can update your answers any time from Edit your answers.");
          if (reply.action === "scenario" && pageContext.page === "asset")
            document.getElementById("what-could-happen")?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (!open) setUnread(true);
        }
        setLocalTurns((t) => [
          ...t,
          { id: reply.id, question: text, reply: reply.text, action: reply.action, sourceIds },
        ]);
        requestId.current = null;
      } catch (e) {
        setError(
          e instanceof TypeError
            ? "I couldn't connect just now. Your question is still here, please try again."
            : e instanceof Error
              ? e.message
              : "I couldn't answer. Please try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [attached, busy, demo, open, pageContext, sessionId, setOpen],
  );

  const newConversation = useCallback(async () => {
    setLocalTurns([]);
    setLastReply(null);
    setError("");
    if (sessionId && !demo) await newConversationMutation({ sessionId }).catch(() => {});
  }, [demo, newConversationMutation, sessionId]);

  const toggleSaved = useCallback(
    async (assetId: string) => {
      if (demo || !sessionId) {
        setSampleSaved((s) => (s.includes(assetId) ? s.filter((x) => x !== assetId) : [...s, assetId]));
        return;
      }
      try {
        await toggleSavedMutation({ sessionId, assetId });
      } catch {
        setNotice("We couldn't save that option. Please try again.");
      }
    },
    [demo, sessionId, toggleSavedMutation],
  );

  const quickAsks = useMemo(() => {
    const base =
      pageContext.page === "asset"
        ? ["Explain the risk in plain words", "What would a 20% drop mean for me?", "Where does this news come from?"]
        : ["What does this category mean for me?", "Which of these is the calmest?", "What should I look at first?"];
    const unlocked = attached.filter((a) => !a.locked || pageContext.page !== "asset");
    if (attached.length >= 2)
      return [`Compare ${attached[0].ticker} and ${attached[1].ticker}`, ...base.slice(0, 2)];
    if (unlocked.length === 1 && pageContext.page !== "asset")
      return [`Tell me about ${unlocked[0].ticker}`, ...base.slice(0, 2)];
    return base;
  }, [attached, pageContext]);

  const value = useMemo<KeelState & KeelApi>(
    () => ({
      sessionId,
      demo,
      isLoaded: session.isLoaded,
      profile,
      hasProfile: demo || Boolean(profileDoc),
      revision,
      savedAssets: demo ? sampleSaved : (profileDoc?.savedAssets ?? []),
      analyzedAssets: demo ? [] : (profileDoc?.analyzedAssets ?? []),
      open,
      busy,
      lastReply: lastReply ?? (profile ? { text: nextStep(profile), sourceIds: [], id: "intro", action: "none" } : null),
      error,
      notice,
      attached,
      pageContext,
      turns,
      dragging,
      dragOver,
      paused,
      unread,
      quickAsks,
      selection,
      pos,
      setOpen,
      toggle: () => setOpen(!open),
      setPageContext,
      attach,
      detach,
      clearAttached,
      ask,
      say,
      setPos,
      newConversation,
      setDragOver,
      setPaused,
      toggleSaved,
      withDemo,
    }),
    [ask, attach, attached, busy, clearAttached, demo, detach, dragOver, dragging, error, lastReply, newConversation, notice, open, pageContext, paused, pos, profile, profileDoc, quickAsks, revision, sampleSaved, say, selection, session.isLoaded, sessionId, setOpen, setPageContext, setPaused, setPos, toggleSaved, turns, unread, withDemo],
  );
  return <KeelCtx.Provider value={value}>{children}</KeelCtx.Provider>;
}

export function useKeel() {
  const ctx = useContext(KeelCtx);
  if (!ctx) throw new Error("useKeel must be used inside KeelProvider");
  return ctx;
}
