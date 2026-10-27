export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }
  const segments = req.query.slug || [];
  if (!Array.isArray(segments) || segments.length > 1 || segments.some((segment) => typeof segment !== 'string' || !segment.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid venue slug.' });
  }
  const base = process.env.MARKETPLACE_VENUES_API_URL || 'https://api.wedplanners.in/api/v1/marketplace/venue-properties';
  const url = new URL(base.replace(/\/$/, '') + (segments.length ? `/${encodeURIComponent(segments[0])}` : ''));
  if (!segments.length) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ success: false, message: 'Invalid pagination.' });
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    for (const key of ['search', 'cityId', 'serviceSubcategoryId']) {
      if (typeof req.query[key] === 'string' && req.query[key].trim()) url.searchParams.set(key, req.query[key].trim());
    }
  }
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    return res.status(response.status).json(await response.json());
  } catch {
    return res.status(502).json({ success: false, message: 'Unable to load wedding venues. Please try again.' });
  }
}
