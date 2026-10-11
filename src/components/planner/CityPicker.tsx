'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, X } from 'lucide-react';
import { searchPlaces, type Place } from '@/lib/api/geocodingApi';
import type { HomePoint } from '@/lib/planner/types';

interface Props {
  value: HomePoint | null;
  onChange: (home: HomePoint | null) => void;
  placeholder?: string;
}

export function CityPicker({ value, onChange, placeholder = 'City, e.g. Denver' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setBusy(true);
      searchPlaces(query, ctrl.signal)
        .then((r) => id === seq.current && setResults(r))
        .catch(() => id === seq.current && setResults([]))
        .finally(() => id === seq.current && setBusy(false));
    }, 300);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const locate = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Location is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ label: 'My location', coordinates: [pos.coords.longitude, pos.coords.latitude] });
        setQuery('');
      },
      () => setGeoError('Could not get your location. Search for a city instead.'),
      { timeout: 10000 },
    );
  };

  if (value) {
    return (
      <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-line bg-white px-3">
        <span className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} className="text-brand" /> {value.label}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Clear city" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="City"
          className="field-input"
          autoComplete="off"
        />
        <button type="button" onClick={locate} aria-label="Use my location" className="btn-ghost !px-3">
          <LocateFixed size={18} />
        </button>
      </div>
      {geoError && <p className="mt-1 text-xs text-brand">{geoError}</p>}
      {(results.length > 0 || busy) && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-pop">
          {busy && results.length === 0 && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ label: r.label, coordinates: r.coordinates });
                  setQuery('');
                  setResults([]);
                }}
                className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-sm hover:bg-surface"
              >
                <MapPin size={15} className="text-muted" /> {r.label}
                <span className="text-xs text-muted">{r.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
