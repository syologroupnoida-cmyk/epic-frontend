import { shopImageUrl } from './shopCatalog.mjs';

export function shopOrderItemProduct(item) {
  const variant = item.variant || item.productVariant || item.variantSnapshot || {};
  const products = [item.product, variant.product, item.productSnapshot].filter(Boolean);
  return { variant, products, slug: item.productSlug || products.find(product => product.slug || product.ecommerceProductSlug)?.slug || products.find(product => product.ecommerceProductSlug)?.ecommerceProductSlug || '' };
}

export function shopOrderItemImages(item) {
  const { variant, products } = shopOrderItemProduct(item);
  const images = [];
  function collect(value) {
    if (Array.isArray(value)) {
      [...value].sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0)).forEach(collect);
    } else if (value && typeof value === 'object') {
      [value.url, value.imageUrl, value.secureUrl, value.secure_url, value.src, value.image, value.images, value.productImages, value.ecommerceProductImages, value.thumbnailUrl, value.thumbnail, value.productImageUrl, value.productImage].forEach(collect);
    } else {
      const url = shopImageUrl(value);
      if (url && !images.includes(url)) images.push(url);
    }
  }
  collect(item);
  collect(variant);
  products.forEach(collect);
  return images;
}
