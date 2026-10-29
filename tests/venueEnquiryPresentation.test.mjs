import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { venueEnquiryPresentation } from '../src/util/venueEnquiryPresentation.mjs';

test('venue enquiry fallback images follow nested venue types and exist locally', async () => {
  for (const [type, expected] of [['Beach Resort', 'resort'], ['Luxury Hotel', 'hotel'], ['Banquet Hall', 'banquet']]) {
    const view = venueEnquiryPresentation({ title: 'Wedding venue', venueTypes: [{ serviceSubcategory: { name: type } }] });
    assert.equal(view.image, `/images/content/enquiry-${expected}.png`);
    await access(`public${view.image}`);
  }
});
test('venue enquiry images prefer property photos, exclude videos and keep a safe fallback', () => {
  const property = { title: 'Lake Resort', coverImageUrl: 'https://example.com/resort.jpg' };
  assert.equal(venueEnquiryPresentation(property).image, property.coverImageUrl);
  assert.equal(venueEnquiryPresentation(property).fallbackImage, '/images/content/enquiry-resort.png');
  const gallery = venueEnquiryPresentation({ title: 'Hotel', coverImageUrl: 'javascript:invalid', media: [{ mediaType: 'VIDEO', url: 'https://example.com/video.mp4' }, { mediaType: 'IMAGE', url: '/images/hotel.jpg' }] });
  assert.equal(gallery.image, '/images/hotel.jpg');
  assert.equal(venueEnquiryPresentation({}).image, '/images/content/enquiry-banquet.png');
});
