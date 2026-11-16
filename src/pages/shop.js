export { default } from '@/modules/ecommerce/ShopHome';
import { shopProductParams } from '@/util/shopCatalog.mjs';

export function getServerSideProps({ query }) {
  const values = Object.fromEntries(['categorySlug', 'subcategoryId', 'minPrice', 'maxPrice', 'page'].filter((key) => typeof query[key] === 'string').map((key) => [key, query[key]]));
  try { return { props: { initialFilters: shopProductParams(values) } }; }
  catch { return { props: { initialFilters: {} } }; }
}
