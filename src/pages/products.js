export default function LegacyShopProductsPage() {
  return null;
}

export function getServerSideProps() {
  return { redirect: { destination: '/product-list', permanent: false } };
}
