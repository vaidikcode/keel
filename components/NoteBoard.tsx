"use client";

import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function NoteBoard() {
  const notes = useQuery(api.notes.list);
  const createNote = useMutation(api.notes.create);
  const removeNote = useMutation(api.notes.remove);

  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createNote({ author, body });
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(noteId: Id<"notes">) {
    setError(null);
    try {
      await removeNote({ noteId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete note");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-teal-300">
          Keel
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">
          Shared notes
        </h1>
        <p className="max-w-xl text-sm leading-6 text-zinc-400">
          Next.js on the frontend, Convex as the realtime backend. Add a note
          and it shows up here for everyone connected to this deployment.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-[#101828] p-5 shadow-xl"
      >
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Name
            </span>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              maxLength={40}
              placeholder="Ada"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-teal-400/60"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Note
            </span>
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={280}
              placeholder="What should the team know?"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-teal-400/60"
              required
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              {body.length}/280 · saved to Convex, not Next.js
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-[#06201b] transition hover:bg-teal-200 disabled:opacity-60"
          >
            {pending ? "Posting…" : "Post note"}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        {notes === undefined ? (
          <p className="text-sm text-zinc-500">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-500">
            No notes yet. Post the first one.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note._id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#101828]/80 px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-sm font-medium text-zinc-100">
                    {note.author}
                  </h2>
                  <time className="text-xs text-zinc-500">
                    {formatTime(note.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {note.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onRemove(note._id)}
                className="shrink-0 rounded-full px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-rose-300"
              >
                Remove
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
