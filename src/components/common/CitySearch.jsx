import { useEffect, useRef, useState } from "react";
import useCities from "@/util/useCities";
import { filterCities } from "@/util/cities.mjs";


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
  const { cities, loading, error, retry } = useCities();
  const [locationStatus, setLocationStatus] = useState("");
  const pickerRef = useRef(null);
  const inputRef = useRef(null);


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


  function selectCity(city) {
    onSelect(city.name, city);
    setQuery("");
    setLocationStatus("");
    setIsOpen(false);
  }

  function handleQueryChange(event) {
    setQuery(event.target.value);
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

          const detectedName = data.result.name.toLowerCase();
          const city = cities.find((item) => detectedName.split(",").some((part) => part.trim() === item.name.toLowerCase()));
          if (city) selectCity(city);
          else setLocationStatus("Your detected city is not available. Please select a city from the list.");
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

  const visibleSuggestions = filterCities(cities, query);

  return (
    <div className={`city-search city-search-${variant} relative`} ref={pickerRef} onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName}
        aria-expanded={isOpen}
        aria-label={label || "Select city"}
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
            placeholder="Search city or state"
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
        {loading ? (
          <p className="px-2 py-2 text-xs font-semibold text-stone-500">
            Loading cities...
          </p>
        ) : null}
        {error ? (
          <p className="px-2 py-1 text-xs font-semibold text-stone-500">
            {error} <button type="button" onClick={retry} className="underline">Try again</button>
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
                {city.label}
              </button>
            ))
          ) : !loading && !error ? (
            <p className="px-2 py-3 text-sm font-semibold text-stone-500">
              {query ? "No matching cities found." : "No cities available yet."}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
