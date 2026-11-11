import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import { shopPanelPath, shopPanelSlugs, shopSlugFromSegments } from '@/util/shopDashboardRoutes.mjs';

export default function ShopDashboardPage({ initialPanelSlug }) {
  return <SuperAdminDashboard initialPanelSlug={initialPanelSlug} />;
}

export function getServerSideProps({ params }) {
  const initialPanelSlug = shopSlugFromSegments(params?.panel);
  if (initialPanelSlug && initialPanelSlug !== 'shop-management') {
    const panel = Object.keys(shopPanelSlugs).find((label) => shopPanelSlugs[label] === initialPanelSlug);
    return { redirect: { destination: shopPanelPath(panel), permanent: false } };
  }
  return initialPanelSlug ? { props: { initialPanelSlug } } : { notFound: true };
}
