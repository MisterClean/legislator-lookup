"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/lib/types";
import { getMapAdapter } from "@/lib/maps";

export function DistrictMap(props: { geometry: GeoJSON.Geometry; focus: Coordinates; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const focusLat = props.focus.lat;
  const focusLng = props.focus.lng;

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        // Clear any previous error when we attempt to mount a new map.
        setError(null);

        const adapter = await getMapAdapter();
        if (cancelled || !containerRef.current) return;

        cleanup = adapter.mountDistrictMap({
          container: containerRef.current,
          geometry: props.geometry,
          focus: { lat: focusLat, lng: focusLng },
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Map failed to load");
      }
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [props.geometry, focusLat, focusLng]);

  return (
    <div
      ref={containerRef}
      className={props.className ?? "h-48 w-full border border-concrete"}
    >
      {error ? (
        <div className="h-full w-full flex items-center justify-center bg-warm text-steel text-xs px-3 text-center">
          {error}
        </div>
      ) : null}
    </div>
  );
}
