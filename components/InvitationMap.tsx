"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
};

export default function InvitationMap({
  lat,
  lng,
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current) {
        return;
      }

      try {
        const L = await import("leaflet");

        if (
          cancelled ||
          !containerRef.current
        ) {
          return;
        }

        map = L.map(containerRef.current, {
          center: [lat, lng],
          zoom: 16,
          scrollWheelZoom: false,
          dragging: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: true,
        });

        L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              "© OpenStreetMap",
          }
        ).addTo(map);

        const icon = L.divIcon({
          html: `
            <div
              style="
                font-size: 34px;
                line-height: 1;
                width: 38px;
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
                filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
              "
            >
              📍
            </div>
          `,
          className: "",
          iconSize: [38, 38],
          iconAnchor: [19, 36],
        });

        L.marker([lat, lng], {
          icon,
        }).addTo(map);
      } catch (error) {
        console.error(
          "INVITATION MAP ERROR:",
          error
        );
      }
    }

    void initMap();

    return () => {
      cancelled = true;

      if (map) {
        map.remove();
        map = null;
      }
    };
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-[24px] border border-black/10 bg-[#F8F5F0]"
    />
  );
}