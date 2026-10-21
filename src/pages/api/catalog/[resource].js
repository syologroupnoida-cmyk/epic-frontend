const endpoints = {
  cities: "https://api.wedplanners.in/api/v1/cities",
  "service-categories": "https://api.wedplanners.in/api/v1/service-categories",
  "service-subcategories": "https://api.wedplanners.in/api/v1/service-subcategories",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }
  const resource = req.query.resource;
  if (typeof resource !== "string" || !Object.hasOwn(endpoints, resource)) {
    return res.status(404).json({ success: false, message: "Catalog not found." });
  }
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: "Invalid pagination." });
  }
  const url = new URL(endpoints[resource]);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (resource === "service-subcategories") {
    const serviceCategoryId = req.query.serviceCategoryId;
    if (typeof serviceCategoryId !== "string" || !serviceCategoryId.trim()) {
      return res.status(400).json({ success: false, message: "Service category is required." });
    }
    url.searchParams.set("serviceCategoryId", serviceCategoryId.trim());
  }
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ success: false, message: "Unable to load options. Please try again." });
  }
}
