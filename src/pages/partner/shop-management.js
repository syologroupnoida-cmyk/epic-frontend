export default function LegacyShopManagementPage() { return null; }

export function getServerSideProps() {
  return { redirect: { destination: '/dashboard/shop', permanent: false } };
}
