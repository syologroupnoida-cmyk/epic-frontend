const normalize = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const categoryNames = {
  'wedding-photographers': 'Photography Services',
  'wedding-videography': 'Photography Services',
  'wedding-music': 'Entertainment',
  caterers: 'Catering Services',
  'wedding-transportation': 'Transportation',
  'wedding-invitations': 'Wedding Invitation',
  'wedding-gifts': 'Gifts',
  florists: 'Decoration Services',
  'wedding-planners': 'Wedding Planning Services',
  'wedding-choreographers': 'Entertainment',
  photobooth: 'Photography Services',
  'wedding-dj': 'Entertainment',
  'wedding-cakes': 'Wedding Cakes',
  'wedding-decorators': 'Decoration Services',
  honeymoon: 'Honeymoon Services',
  'wedding-entertainment': 'Entertainment',
  'tent-house': 'Wedding Rentals',
};

export function vendorMenuHref(option, categories = []) {
  const candidates = new Set([normalize(option.title), normalize(option.slug)].filter(Boolean));
  const available = categories.filter((category) => category.isActive !== false && category.offeringKind !== 'VENUE_PROPERTY');
  const query = new URLSearchParams();
  const parent = available.find((category) => category.subcategories?.some((sub) => sub.isActive !== false && candidates.has(normalize(sub.name))));
  if (parent?.id) {
    const sub = parent.subcategories.find((sub) => sub.isActive !== false && candidates.has(normalize(sub.name)));
    query.set('serviceCategoryId', parent.id);
    if (sub.id) query.set('serviceSubcategoryId', sub.id);
  } else {
    const category = available.find((item) => candidates.has(normalize(item.name)) || candidates.has(normalize(item.slug)) || normalize(item.name) === normalize(categoryNames[option.slug]));
    if (category?.id) query.set('serviceCategoryId', category.id);
    // Unknown menu entries still open a filtered directory.
    if (!category) query.set('search', option.title || option.slug.replaceAll('-', ' '));
  }
  return `/vendors?${query}`;
}
