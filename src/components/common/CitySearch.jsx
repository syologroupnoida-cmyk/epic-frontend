import { useEffect, useMemo, useRef, useState } from "react";

const fallbackCityOptions = [
  { id: "fallback-delhi-ncr", name: "Delhi NCR, Delhi, India" },
  { id: "fallback-noida", name: "Noida, Uttar Pradesh, India" },
  { id: "fallback-greater-noida", name: "Greater Noida, Uttar Pradesh, India" },
  { id: "fallback-gurugram", name: "Gurugram, Haryana, India" },
  { id: "fallback-mumbai", name: "Mumbai, Maharashtra, India" },
  { id: "fallback-jaipur", name: "Jaipur, Rajasthan, India" },
  { id: "fallback-bangalore", name: "Bangalore, Karnataka, India" },
  { id: "fallback-goa", name: "Goa, India" },
  { id: "fallback-ahmedabad", name: "Ahmedabad, Gujarat, India" },
  { id: "fallback-udaipur", name: "Udaipur, Rajasthan, India" },
  { id: "fallback-kolkata", name: "Kolkata, West Bengal, India" },
  { id: "fallback-hyderabad", name: "Hyderabad, Telangana, India" },
  { id: "fallback-chennai", name: "Chennai, Tamil Nadu, India" },
  { id: "fallback-pune", name: "Pune, Maharashtra, India" },
  { id: "fallback-lucknow", name: "Lucknow, Uttar Pradesh, India" },
];

export default function CitySearch({
  value,
  onSelect,
  buttonClassName,
  panelClassName = "",
  align = "left",
  label = "",
  variant = "header",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(fallbackCityOptions);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  const fallbackSuggestions = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return fallbackCityOptions;

    return fallbackCityOptions.filter((city) =>
      city.name.toLowerCase().includes(search),
    );
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    const search = query.trim();

    if (search.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/location-search?q=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Location search failed.");
        }

        setSuggestions(data.results?.length ? data.results : fallbackSuggestions);
        setSearchError(data.results?.length ? "" : "No matching place found.");
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions(fallbackSuggestions);
          setSearchError("Showing saved cities. Live suggestions are unavailable.");
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fallbackSuggestions, query]);

  function selectCity(city) {
    onSelect(city.name);
    setQuery("");
    setSearchError("");
    setLocationStatus("");
    setIsOpen(false);
  }

  function handleQueryChange(event) {
    const nextQuery = event.target.value;

    setQuery(nextQuery);

    if (nextQuery.trim().length < 2) {
      setSearchError("");
      setIsSearching(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }

    setLocationStatus("Detecting your nearest city...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/reverse-geocode?lat=${encodeURIComponent(
              position.coords.latitude,
            )}&lng=${encodeURIComponent(position.coords.longitude)}`,
          );
          const data = await response.json();

          if (!response.ok || !data.result?.name) {
            throw new Error(data.message || "Location lookup failed.");
          }

          selectCity(data.result);
        } catch (error) {
          setLocationStatus(
            "We found your GPS point, but could not read the city. Search manually.",
          );
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Allow location access to auto-detect your city."
            : "Could not read your current location. Search manually.";

        setLocationStatus(message);
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 12000 },
    );
  }

  const visibleSuggestions = query.trim().length < 2 ? fallbackSuggestions : suggestions;

  return (
    <div className={`city-search city-search-${variant} relative`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName}
      >
        <span className="location-pin-icon" aria-hidden="true" />
        <span className="city-search-copy">
          {label ? <span className="city-search-label">{label}</span> : null}
          <span className="city-search-selected">{value}</span>
        </span>
        <span className="header-chevron shrink-0" aria-hidden="true" />
      </button>
      <div
        className={`city-search-panel absolute top-full z-[1010] mt-2 rounded border border-rose-100 bg-white p-2 shadow-xl transition duration-150 ${
          align === "right" ? "right-0" : "left-0"
        } ${
          isOpen
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible translate-y-2 opacity-0"
        } ${panelClassName}`}
      >
        <div className="city-search-field">
          <span className="search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search city, state or country"
          />
        </div>
        <button
          type="button"
          onClick={detectLocation}
          className="city-current-location"
        >
          <span className="target-icon" aria-hidden="true" />
          Use current location
        </button>
        {locationStatus ? (
          <p className="px-2 py-1 text-xs font-semibold text-stone-500">
            {locationStatus}
          </p>
        ) : null}
        {isSearching ? (
          <p className="px-2 py-2 text-xs font-semibold text-stone-500">
            Searching places...
          </p>
        ) : null}
        {searchError ? (
          <p className="px-2 py-1 text-xs font-semibold text-stone-500">
            {searchError}
          </p>
        ) : null}
        <div className="city-options-list">
          {visibleSuggestions.length ? (
            visibleSuggestions.map((city) => (
              <button
                key={city.id || city.name}
                type="button"
                onClick={() => selectCity(city)}
                className="city-option"
              >
                {city.name}
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-sm font-semibold text-stone-500">
              Type at least 2 letters to search places
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
