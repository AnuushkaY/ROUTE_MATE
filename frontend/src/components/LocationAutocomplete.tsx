import React, { useState, useEffect, useRef } from 'react';
import { Loader, Crosshair, MapPin, X } from 'lucide-react';
import axios from 'axios';

interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}

interface PlaceResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelectLocation,
  placeholder,
  icon
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (value.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Cancel previous request if typing rapidly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              format: 'json',
              q: value,
              limit: 5,
              addressdetails: 1
            },
            signal: controller.signal,
            headers: {
              'Accept-Language': 'en-US,en'
            }
          }
        );
        setResults(response.data);
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          console.error("Nominatim Search Error", err);
          setErrorMsg('Failed to fetch results');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  const handleSelect = (place: PlaceResult) => {
    // Format name to the smartest short name (before the first comma)
    const parts = place.display_name.split(',');
    const shortName = parts[0].trim();
    
    onChange(shortName);
    onSelectLocation(parseFloat(place.lat), parseFloat(place.lon), shortName);
    setIsOpen(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    setErrorMsg('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse`,
            {
              params: { format: 'json', lat, lon: lng },
              headers: { 'Accept-Language': 'en-US,en' }
            }
          );
          
          if (res.data && res.data.display_name) {
            const parts = res.data.display_name.split(',');
            const shortName = parts[0].trim();
            onChange(shortName);
            onSelectLocation(lat, lng, shortName);
            setIsOpen(false);
          } else {
            // Fallback if reverse geocoding fails but we got coords
            onChange("Current Location");
            onSelectLocation(lat, lng, "Current Location");
            setIsOpen(false);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          // Still fallback to coords
          onChange("Current Location");
          onSelectLocation(lat, lng, "Current Location");
          setIsOpen(false);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Location permission denied.');
        } else {
          setErrorMsg('Failed to get your location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        {/* Render the specific passed Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {icon}
        </div>
        
        <input
          type="text"
          className="input-premium pl-12 pr-10 w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        
        {/* Loading Spinner in input or Clear button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {loading && value.trim().length >= 3 && (
            <Loader size={16} className="text-gray-400 animate-spin" />
          )}
          {!loading && value && (
            <button 
              type="button" 
              onClick={() => { onChange(''); setResults([]); }}
              className="text-gray-400 hover:text-gray-600 outline-none"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Auto-suggest Dropdown */}
      {isOpen && (value.trim().length >= 3 || errorMsg || geoLoading || !value) && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-sm flex flex-col max-h-[300px]">
          
          {/* Always show "Use Current Location" when first opening or clicking */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors text-left w-full"
          >
            {geoLoading ? (
              <Loader size={18} className="text-blue-500 animate-spin" />
            ) : (
              <Crosshair size={18} className="text-blue-500" />
            )}
            <span className="font-bold text-blue-500 tracking-tight">
              {geoLoading ? 'Fetching GPS...' : 'Use current location'}
            </span>
          </button>

          {/* Results Area Dropdown */}
          <div className="overflow-y-auto custom-scrollbar">
            {errorMsg && (
              <div className="p-4 text-xs font-bold text-red-500 text-center">{errorMsg}</div>
            )}
            
            {!loading && results.length === 0 && value.trim().length >= 3 && !errorMsg && (
               <div className="p-4 text-xs font-bold text-gray-400 text-center italic">No locations found.</div>
            )}

            {!errorMsg && results.map((place) => {
              const parts = place.display_name.split(',');
              const primary = parts[0].trim();
              const secondary = parts.slice(1).map(p => p.trim()).join(', ');

              return (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left p-4 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 items-start"
                >
                  <MapPin size={18} className="text-gray-300 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-black text-[#121212] truncate leading-tight mb-1">{primary}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest line-clamp-1">{secondary}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
