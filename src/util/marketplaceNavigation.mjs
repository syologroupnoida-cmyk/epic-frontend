const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
const queryIds = (value) => unique((Array.isArray(value) ? value : [value]).flatMap((item) => typeof item === 'string' ? item.split(',') : []));

export function readMarketplaceFilters(query = {}, categories = []) {
  const subcategoryIds = queryIds(query.serviceSubcategoryId);
  const categoryIds = queryIds(query.serviceCategoryId);
  for (const category of categories) {
    if ((category.subcategories || []).some((item) => subcategoryIds.includes(item.id)) && !categoryIds.includes(category.id)) categoryIds.push(category.id);
  }
  return { categoryIds, subcategoryIds, search: typeof query.search === 'string' ? query.search.trim() : '' };
}

export function homeMarketplaceHref(item, { venue = false, selectedId = '', categories = [] } = {}) {
  const records = venue ? item.venueTypes || item.venueTypeIds || [] : item.services || [];
  const filters = records.map((record) => {
    if (typeof record === 'string') return { subcategoryId: record, categoryId: '' };
    const sub = record.serviceSubcategory || record.subcategory || record.service || record.venueType || record;
    const subcategoryId = record.serviceSubcategoryId || record.serviceSubCategoryId || record.venueTypeId || sub.id || sub._id || '';
    const category = sub.category || sub.serviceCategory || record.category || record.serviceCategory;
    const categoryId = sub.serviceCategoryId || record.serviceCategoryId || category?.id || category?._id || categories.find((category) => category.subcategories?.some((sub) => sub.id === subcategoryId))?.id || '';
    return { subcategoryId, categoryId };
  });
  const relevant = !venue && selectedId ? filters.filter((filter) => filter.categoryId === selectedId) : filters;
  const subcategoryIds = venue && selectedId ? [selectedId] : unique(relevant.map((filter) => filter.subcategoryId));
  const categoryIds = venue ? [] : selectedId ? [selectedId] : unique(relevant.map((filter) => filter.categoryId));
  const query = new URLSearchParams();
  if (categoryIds.length) query.set('serviceCategoryId', categoryIds.join(','));
  if (subcategoryIds.length) query.set('serviceSubcategoryId', subcategoryIds.join(','));
  if (!query.size && item.title) query.set('search', item.title);
  return `${venue ? '/venues' : '/services'}${query.size ? `?${query}` : ''}`;
}
