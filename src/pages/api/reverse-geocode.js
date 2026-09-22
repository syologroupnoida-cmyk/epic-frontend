const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

function formatAddress(address = {}, fallback = "", type = "") {
  if (type === "country") return address.country || fallback;
  if (type === "state") return [address.state, address.country].filter(Boolean).join(", ") || fallback;

  const primary =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state_district ||
    "";
  if (type === "city") return primary || fallback;

  const parts = [primary, address.state, address.country].filter(Boolean);
  const uniqueParts = [...new Set(parts)];

  return uniqueParts.length ? uniqueParts.join(", ") : fallback;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const type = String(req.query.type || "").trim().toLowerCase();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  const url = new URL("/reverse", NOMINATIM_BASE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("accept-language", "en");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EpicWedz reverse geocode",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocode failed with ${response.status}`);
    }

    const place = await response.json();
    const name = formatAddress(place.address, place.display_name, type);

    if (!name) {
      return res.status(404).json({ message: "No location found." });
    }

    return res.status(200).json({
      result: {
        id: place.place_id,
        name,
        displayName: place.display_name,
        lat: place.lat,
        lng: place.lon,
      },
    });
  } catch (error) {
    return res.status(502).json({
      message: "Unable to detect location right now.",
    });
  }
}
