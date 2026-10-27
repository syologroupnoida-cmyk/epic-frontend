const http = require('http');
const venue = {"id": "venue-demo", "slug": "palace-venue", "title": "Palace venue", "description": "A wedding hall and garden.", "startingPrice": 20000, "priceType": "STARTING_FROM", "city": {"id": "city-demo", "name": "Chandigarh"}, "address": {"street": "12 Palace Road", "locality": "City Centre", "state": "Chandigarh", "pincode": "160001", "country": "India"}, "capacityMin": 100, "capacityMax": 500, "rooms": 20, "parkingCapacity": 50, "amenities": ["Parking", "Bridal room"], "metadata": {"alcoholAllowed": false, "outsideCateringAllowed": true}, "venueTypes": [{"venueType": {"id": "banquet-demo", "name": "Banquet", "category": {"name": "Venue Services", "offeringKind": "VENUE_PROPERTY"}}}], "media": [], "vendor": {"businessName": "Palace Events", "about": "Celebrate in our garden."}};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const base = '/api/v1/marketplace/venue-properties';
  function send(status, body) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
  if (req.method !== 'GET') return send(501, { message: 'Endpoint not modeled.' });
  if (url.pathname === base) {
    const id = url.searchParams.get('serviceSubcategoryId');
    if (id === 'error-demo') return send(503, { success: false, message: 'Venue service unavailable.' });
    let items = id === 'garden-demo' ? [venue, { ...venue, id: 'garden-demo', slug: 'garden-venue', title: 'Garden venue' }] : id === 'paged-demo' ? Array.from({ length: 21 }, (_, i) => ({ ...venue, id: `paged-${i}`, slug: `palace-${i}` })) : [venue];
    const cityId = url.searchParams.get('cityId');
    const search = (url.searchParams.get('search') || '').toLowerCase();
    items = items.filter(item => (!cityId || item.city.id === cityId) && item.title.toLowerCase().includes(search));
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 20);
    return send(200, { success: true, data: { venueProperties: items.slice((page - 1) * limit, page * limit), pagination: { total: items.length, hasNextPage: page * limit < items.length } } });
  }
  if (url.pathname === base + '/palace-venue') return send(200, { success: true, data: venue });
  if (url.pathname === base + '/missing-venue') return send(404, { success: false, message: 'Venue not found.' });
  return send(501, { message: 'Endpoint not modeled.' });
});
server.listen(process.env.PORT || 4500);
