"use client";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * A horizontal rail of cards with a shallow 3D turn: each card tilts by how
 * far it sits from the middle, so the row reads as curving away rather than
 * scrolling flat.
 *
 * The tilt is published as a custom property and composed into the card's own
 * transform, because the cards already scale themselves on hover — writing
 * `transform` here directly would fight that.
 *
 * It stays a real scroll container: keyboard, trackpad and touch all work, and
 * the turn is decoration that `prefers-reduced-motion` removes entirely. The
 * scrollbar is hidden in favour of the arrows and dots, which move the rail a
 * whole page of whole cards at a time so a card is never left half shown.
 */
export function Carousel({
  title,
  note,
  children,
  resetKey,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  /** Identity of the cards on the rail; a change sends it back to the start. */
  resetKey?: string;
}) {
  const headingId = useId();
  const track = useRef<HTMLOListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const touched = useRef(false);
  const pageWidth = useRef(0);

  const paint = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);

    const kids = Array.from(el.children) as HTMLElement[];
    // Both of these must be independent of this rail's own width, because the
    // max-width set below is derived from them: measuring the step off the
    // track would make the width feed back into itself and loop forever. The
    // gutter comes from CSS and a card's width from the card, so neither moves
    // when the rail resizes. A hovered card is wider than the rest, so the
    // median width is the resting one.
    const gutter = parseFloat(getComputedStyle(el).columnGap) || 0;
    const widths = kids.map((k) => k.offsetWidth).sort((a, b) => a - b);
    const cardWidth = widths.length ? widths[widths.length >> 1] : 0;
    const step = cardWidth > 0 ? cardWidth + gutter : 0;

    // Width the rail to a whole number of cards and centre it, so the row never
    // ends on a card sliced down the middle. This measures the space the rail
    // has to work with — the parent, less the arrows — rather than the rail's
    // own width, which is the thing being set here and would otherwise feed
    // back into itself.
    const rail = el.parentElement;
    if (rail && step > 0) {
      const railGap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      const flanking = (Array.from(rail.children) as HTMLElement[]).filter((c) => c !== el);
      const available =
        rail.clientWidth -
        flanking.reduce((sum, a) => sum + a.offsetWidth, 0) -
        railGap * flanking.length;
      const perPage = Math.max(1, Math.floor((available + gutter) / step));
      const width = `${perPage * step - gutter}px`;
      if (el.style.maxWidth !== width) el.style.maxWidth = width;
    }

    const width = step > 0 ? Math.max(step, Math.floor((el.clientWidth + gutter) / step) * step) : el.clientWidth;
    pageWidth.current = width;
    setPages(Math.max(1, Math.ceil((el.scrollWidth - el.clientWidth) / width) + 1));
    setPage(width > 0 ? Math.round(el.scrollLeft / width) : 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    for (const child of kids) {
      const cardMid = child.offsetLeft + child.offsetWidth / 2;
      const away = (cardMid - mid) / (el.clientWidth / 2);
      const tilt = Math.max(-1, Math.min(1, away)) * -13;
      child.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    }
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const touch = () => {
      touched.current = true;
    };
    el.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    // Every way a reader can move the rail themselves. Once any of them fires,
    // the rail stops being pulled back to the start below.
    for (const type of ["wheel", "keydown", "focusin", "pointerdown"] as const)
      el.addEventListener(type, touch, { passive: true });
    return () => {
      el.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
      for (const type of ["wheel", "keydown", "focusin", "pointerdown"] as const)
        el.removeEventListener(type, touch);
    };
  }, [paint]);

  // The tilt is an inline custom property, so it lives on the DOM node rather
  // than in the render output: a card React creates on a later data arrival
  // comes in without one. Repainting after every render keeps the whole rail
  // turned — the item count alone is not enough to key off, because the list
  // can swap which assets it holds while staying the same length.
  useEffect(paint);

  useEffect(() => {
    const el = track.current;
    // These rails fill in over several requests and re-sort as each one lands,
    // and the browser keeps its scroll position across the change — which left
    // "You might be interested" opening at its last card. The first card
    // belongs in view, so send the rail back to the start whenever its contents
    // change, but never once the reader has moved it themselves.
    //
    // This must stay keyed to `resetKey`: writing `scrollLeft` on every render
    // deadlocks, because the scroll it causes repaints, which renders again.
    if (el && !touched.current) el.scrollLeft = 0;
  }, [resetKey]);

  const goTo = (index: number) => {
    touched.current = true;
    track.current?.scrollTo({ left: index * pageWidth.current, behavior: "smooth" });
  };
  const by = (dir: -1 | 1) => goTo(Math.max(0, Math.min(pages - 1, page + dir)));

  // Drag anywhere on the rail to sweep it, without stealing clicks on cards.
  function onPointerDown(e: React.PointerEvent<HTMLOListElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: track.current?.scrollLeft ?? 0,
      moved: false,
    };
  }
  function onPointerMove(e: React.PointerEvent<HTMLOListElement>) {
    if (!drag.current.active || !track.current) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) < 4) return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      setSweeping(true);
      track.current.setPointerCapture(e.pointerId);
    }
    track.current.scrollLeft = drag.current.startScroll - dx;
  }
  function endDrag(e: React.PointerEvent<HTMLOListElement>) {
    if (drag.current.moved && track.current?.hasPointerCapture(e.pointerId))
      track.current.releasePointerCapture(e.pointerId);
    drag.current.active = false;
    setSweeping(false);
  }

  return (
    <section className="carousel-section" aria-labelledby={headingId}>
      <div className="section-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {note && <p className="fine-print">{note}</p>}
        </div>
      </div>
      <div className="carousel-rail">
        <button
          type="button"
          className="carousel-arrow"
          aria-label={`Scroll ${title} left`}
          disabled={atStart}
          onClick={() => by(-1)}
        >
          <Icon name="back" size={18} />
        </button>
        <ol
          ref={track}
          className={`ranked-row carousel-track ${sweeping ? "is-sweeping" : ""}`}
          aria-labelledby={headingId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {children}
        </ol>
        <button
          type="button"
          className="carousel-arrow"
          aria-label={`Scroll ${title} right`}
          disabled={atEnd}
          onClick={() => by(1)}
        >
          <Icon name="arrow" size={18} />
        </button>
      </div>
      {pages > 1 && (
        <div className="carousel-dots">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`carousel-dot ${i === page ? "is-active" : ""}`}
              aria-label={`${title}, page ${i + 1} of ${pages}`}
              aria-current={i === page}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
