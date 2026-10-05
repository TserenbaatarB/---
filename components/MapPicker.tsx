"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER: [number, number] = [47.9184, 106.9177];

export default function MapPicker({
  lat,
  lng,
  onChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }

      const icon = L.divIcon({
        className: "",
        html: "<div style=\"font-size:30px;line-height:30px;transform:translate(-50%,-100%)\">📍</div>",
        iconSize: [0, 0],
      });

      const map = L.map(containerRef.current).setView(
        lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER,
        lat !== null ? 16 : 12
      );

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }
      ).addTo(map);

      function place(latitude: number, longitude: number) {
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          return;
        }

        const marker = L.marker([latitude, longitude], {
          icon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onChangeRef.current(position.lat, position.lng);
        });

        markerRef.current = marker;
      }

      if (lat !== null && lng !== null) {
        place(lat, lng);
      }

      map.on("click", (event) => {
        place(event.latlng.lat, event.latlng.lng);
        onChangeRef.current(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once; later coordinates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || lat === null || lng === null) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      import("leaflet").then(({ default: L }) => {
        if (!mapRef.current || markerRef.current) return;

        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "",
            html: "<div style=\"font-size:30px;line-height:30px;transform:translate(-50%,-100%)\">📍</div>",
            iconSize: [0, 0],
          }),
          draggable: true,
        }).addTo(mapRef.current);

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onChangeRef.current(position.lat, position.lng);
        });

        markerRef.current = marker;
      });
    }

    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="z-0 h-64 w-full overflow-hidden rounded-2xl border border-black/10"
    />
  );
}
