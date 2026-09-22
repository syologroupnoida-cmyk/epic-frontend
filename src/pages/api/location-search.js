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

  const query = String(req.query.q || "").trim();
  const type = String(req.query.type || "").trim().toLowerCase();

  if (query.length < 2) {
    return res.status(200).json({ results: [] });
  }

  const url = new URL("/search", NOMINATIM_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "en");

  if (["city", "state", "country"].includes(type)) {
    url.searchParams.set("featureType", type);
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EpicWedz location search",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Location search failed with ${response.status}`);
    }

    const places = await response.json();
    const seen = new Set();
    const results = places
      .map((place) => ({
        id: place.place_id,
        name: formatAddress(place.address, place.display_name, type),
        displayName: place.display_name,
        lat: place.lat,
        lng: place.lon,
      }))
      .filter((place) => {
        const key = place.name.toLowerCase();

        if (!place.name || seen.has(key)) return false;

        seen.add(key);
        return true;
      });

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(502).json({
      message: "Unable to fetch location suggestions right now.",
    });
  }
}
