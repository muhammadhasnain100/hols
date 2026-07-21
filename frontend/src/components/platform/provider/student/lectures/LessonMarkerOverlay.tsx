"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type MarkerStroke = {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
};

type LessonMarkerOverlayProps = {
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  layoutKey: string;
  color: string;
  width: number;
  strokes: MarkerStroke[];
  onStrokesChange: (strokes: MarkerStroke[]) => void;
};

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: MarkerStroke,
) {
  const { points, color, width } = stroke;
  if (points.length < 2) return;

  context.save();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }

  context.stroke();
  context.restore();
}

function redrawCanvas(
  context: CanvasRenderingContext2D,
  strokes: MarkerStroke[],
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  strokes.forEach((stroke) => drawStroke(context, stroke));
}

export function LessonMarkerOverlay({
  active,
  containerRef,
  scrollRef,
  layoutKey,
  color,
  width,
  strokes,
  onStrokesChange,
}: LessonMarkerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<MarkerStroke | null>(null);
  const strokesRef = useRef(strokes);

  strokesRef.current = strokes;

  const syncCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const nextWidth = container.offsetWidth;
    const nextHeight = container.offsetHeight;

    canvas.width = Math.max(1, Math.floor(nextWidth * pixelRatio));
    canvas.height = Math.max(1, Math.floor(nextHeight * pixelRatio));

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    redrawCanvas(context, strokesRef.current, nextWidth, nextHeight);
  }, [containerRef]);

  useEffect(() => {
    syncCanvasSize();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      syncCanvasSize();
    });

    observer.observe(container);
    window.addEventListener("resize", syncCanvasSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [containerRef, syncCanvasSize]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      syncCanvasSize();
    });

    return () => cancelAnimationFrame(frame);
  }, [layoutKey, syncCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const container = containerRef.current;
    if (!canvas || !context || !container) return;

    redrawCanvas(context, strokes, container.offsetWidth, container.offsetHeight);
  }, [containerRef, strokes]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      if (!active || drawingRef.current) return;

      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      scrollElement.scrollTop += event.deltaY;
    },
    [active, scrollRef],
  );

  const finishStroke = useCallback(() => {
    const stroke = currentStrokeRef.current;
    drawingRef.current = false;
    currentStrokeRef.current = null;

    if (!stroke || stroke.points.length < 2) return;
    onStrokesChange([...strokesRef.current, stroke]);
  }, [onStrokesChange]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!active) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const rect = event.currentTarget.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      drawingRef.current = true;
      currentStrokeRef.current = {
        points: [point],
        color,
        width,
      };
    },
    [active, color, width],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!active || !drawingRef.current || !currentStrokeRef.current) return;

      event.preventDefault();

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const stroke = currentStrokeRef.current;
      const previousPoint = stroke.points[stroke.points.length - 1];
      stroke.points.push(point);

      drawStroke(context, {
        points: [previousPoint, point],
        color: stroke.color,
        width: stroke.width,
      });
    },
    [active],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      finishStroke();
    },
    [finishStroke],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden={!active}
      className={cn(
        "lesson-marker-overlay absolute inset-0 z-10 h-full w-full touch-none",
        active ? "pointer-events-auto cursor-crosshair" : "pointer-events-none",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={finishStroke}
      onWheel={handleWheel}
    />
  );
}

export const MARKER_COLORS = [
  { id: "yellow", label: "Yellow", value: "rgba(255, 220, 0, 0.52)" },
  { id: "green", label: "Green", value: "rgba(120, 210, 90, 0.48)" },
  { id: "pink", label: "Pink", value: "rgba(255, 120, 190, 0.45)" },
  { id: "blue", label: "Blue", value: "rgba(90, 170, 255, 0.42)" },
  { id: "orange", label: "Orange", value: "rgba(255, 150, 60, 0.48)" },
] as const;

export const MARKER_SIZES = [
  { id: "fine", label: "Fine", value: 6 },
  { id: "medium", label: "Medium", value: 14 },
  { id: "wide", label: "Wide", value: 26 },
] as const;

export type MarkerColorId = (typeof MARKER_COLORS)[number]["id"];
export type MarkerSizeId = (typeof MARKER_SIZES)[number]["id"];

export function loadMarkerStrokes(lessonId: string): MarkerStroke[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(`hols-learning-markers-${lessonId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarkerStroke[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMarkerStrokes(lessonId: string, strokes: MarkerStroke[]) {
  if (typeof window === "undefined") return;

  if (strokes.length === 0) {
    sessionStorage.removeItem(`hols-learning-markers-${lessonId}`);
    return;
  }

  sessionStorage.setItem(`hols-learning-markers-${lessonId}`, JSON.stringify(strokes));
}
