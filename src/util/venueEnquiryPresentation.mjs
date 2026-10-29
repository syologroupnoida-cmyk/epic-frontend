const fallbackImages = {
  resort: '/images/content/enquiry-resort.png',
  hotel: '/images/content/enquiry-hotel.png',
  banquet: '/images/content/enquiry-banquet.png',
};

export function venueEnquiryPresentation(property) {
  const types = (property.venueTypes || []).map((record) => {
    if (typeof record === 'string') return record;
    const type = record.serviceSubcategory || record.subcategory || record.service || record.venueType || record;
    return type.name || type.title || record.name || '';
  });
  const description = `${types.join(' ')} ${property.propertyType || ''} ${property.title || ''}`.toLowerCase();
  const kind = /resort|beach|farmhouse|garden|lawn/.test(description) ? 'resort' : /hotel/.test(description) ? 'hotel' : 'banquet';
  const safe = (value) => typeof value === 'string' && /^(https?:\/\/|\/(?!\/))/.test(value);
  const photo = [property.coverImageUrl, property.imageUrl, ...(property.media || []).filter((item) => item.mediaType !== 'VIDEO').map((item) => item.url)].find(safe);
  return {
    image: photo || fallbackImages[kind],
    fallbackImage: fallbackImages[kind],
    imageAlt: photo ? `${property.title || 'Wedding venue'} celebration space` : `Wedding ${kind === 'banquet' ? 'banquet hall' : kind} setting`,
  };
}
