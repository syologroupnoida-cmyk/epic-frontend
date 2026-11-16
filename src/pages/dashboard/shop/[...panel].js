import { shopPanelPath, shopPanelSlugs, shopSlugFromSegments } from '@/util/shopDashboardRoutes.mjs';

export default function LegacyShopPanelPage() {
  return null;
}

export function getServerSideProps({ params }) {
  const initialPanelSlug = shopSlugFromSegments(params?.panel);
  if (initialPanelSlug && initialPanelSlug !== 'shop-management') {
    const panel = Object.keys(shopPanelSlugs).find((label) => shopPanelSlugs[label] === initialPanelSlug);
    return { redirect: { destination: shopPanelPath(panel), permanent: false } };
  }
  return { notFound: true };
}
