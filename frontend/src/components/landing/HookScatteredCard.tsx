"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

const HOOK_PATH_SYNC = "hook-path-sync";

type HookScatteredCardProps = {
  id: string;
  title: string;
  color: string;
  icon: ReactNode;
  top: string;
  left: string;
  cardRef?: (node: HTMLElement | null) => void;
  className?: string;
};

/**
 * Draggable scatter chip (PDFs, YouTube, …). Moves by updating top/left so
 * GSAP opacity/y transforms stay intact and diagram wires can re-measure.
 */
export function HookScatteredCard({
  id,
  title,
  color,
  icon,
  top,
  left,
  cardRef,
  className,
}: HookScatteredCardProps) {
  const { setPaused } = useSmoothScroll();
  const nodeRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const originRef = useRef({ left: 0, top: 0, pointerX: 0, pointerY: 0, width: 0, height: 0 });
  const [pos, setPos] = useState({ top, left });
  const [dragging, setDragging] = useState(false);
  const syncRaf = useRef<number | null>(null);

  useEffect(() => {
    setPos({ top, left });
  }, [top, left]);

  const assignRef = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      cardRef?.(node);
    },
    [cardRef],
  );

  const syncWires = useCallback(() => {
    if (syncRaf.current != null) return;
    syncRaf.current = window.requestAnimationFrame(() => {
      syncRaf.current = null;
      window.dispatchEvent(new Event(HOOK_PATH_SYNC));
    });
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const node = nodeRef.current;
    const parent = node?.offsetParent as HTMLElement | null;
    if (!node || !parent) return;

    event.preventDefault();
    event.stopPropagation();

    const parentRect = parent.getBoundingClientRect();
    draggingRef.current = true;
    setDragging(true);
    setPaused(true);
    originRef.current = {
      left: (node.offsetLeft / parentRect.width) * 100,
      top: (node.offsetTop / parentRect.height) * 100,
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: parentRect.width,
      height: parentRect.height,
    };
    node.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!draggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const { left: startLeft, top: startTop, pointerX, pointerY, width, height } = originRef.current;
    if (!width || !height) return;

    const dxPct = ((event.clientX - pointerX) / width) * 100;
    const dyPct = ((event.clientY - pointerY) / height) * 100;

    const nextLeft = Math.max(0, Math.min(88, startLeft + dxPct));
    const nextTop = Math.max(4, Math.min(96, startTop + dyPct));
    setPos({ left: `${nextLeft}%`, top: `${nextTop}%` });
    syncWires();
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    setPaused(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    syncWires();
  }

  return (
    <article
      ref={assignRef}
      data-hook-card
      data-card-id={id}
      className={cn(
        "absolute z-20 inline-flex -translate-y-1/2 touch-none select-none items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 opacity-0",
        dragging && "z-30 scale-105",
        className,
      )}
      style={{ top: pos.top, left: pos.left, cursor: "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap font-sans text-[13px] font-semibold leading-none text-primary">
        {title}
      </span>
    </article>
  );
}

/** Flex-wrap mobile cards — same drag behavior using translate offsets. */
export function HookScatteredCardInline({
  id,
  title,
  color,
  icon,
  cardRef,
}: Omit<HookScatteredCardProps, "top" | "left" | "className">) {
  const { setPaused } = useSmoothScroll();
  const nodeRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0, pointerX: 0, pointerY: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const syncRaf = useRef<number | null>(null);

  const assignRef = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      cardRef?.(node);
    },
    [cardRef],
  );

  const syncWires = useCallback(() => {
    if (syncRaf.current != null) return;
    syncRaf.current = window.requestAnimationFrame(() => {
      syncRaf.current = null;
      window.dispatchEvent(new Event(HOOK_PATH_SYNC));
    });
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    setDragging(true);
    setPaused(true);
    originRef.current = {
      x: offset.x,
      y: offset.y,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!draggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const next = {
      x: originRef.current.x + (event.clientX - originRef.current.pointerX),
      y: originRef.current.y + (event.clientY - originRef.current.pointerY),
    };
    setOffset(next);
    syncWires();
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    setPaused(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    syncWires();
  }

  return (
    <article
      ref={assignRef}
      data-hook-card
      data-card-id={id}
      className={cn(
        "relative z-10 inline-flex touch-none select-none items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 opacity-0",
        dragging && "z-30 scale-105",
      )}
      style={{
        cursor: "default",
        translate: `${offset.x}px ${offset.y}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap font-sans text-[13px] font-semibold leading-none text-primary">
        {title}
      </span>
    </article>
  );
}
