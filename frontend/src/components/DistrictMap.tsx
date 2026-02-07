"use client";

import { useEffect, useRef } from "react";
import type { Coordinates } from "@/lib/types";
import { getMapAdapter } from "@/lib/maps";

export function DistrictMap(props: { geometry: GeoJSON.Geometry; focus: Coordinates; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const adapter = await getMapAdapter();
      if (cancelled || !containerRef.current) return;

      cleanup = adapter.mountDistrictMap({
        container: containerRef.current,
        geometry: props.geometry,
        focus: props.focus,
      });
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [props.geometry, props.focus.lat, props.focus.lng]);

  return (
    <div
      ref={containerRef}
      className={props.className ?? "h-48 w-full border border-concrete"}
    />
  );
}
