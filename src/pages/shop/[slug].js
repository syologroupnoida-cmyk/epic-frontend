export { default } from '@/modules/ecommerce/ShopProductPage';

export function getServerSideProps({ params }) {
  return typeof params?.slug === 'string' && params.slug.trim() ? { props: { slug: params.slug } } : { notFound: true };
}
