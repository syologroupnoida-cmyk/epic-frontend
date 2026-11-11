import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import { isShopPanelSlug, shopPanelPath, shopPanelSlugs } from '@/util/shopDashboardRoutes.mjs';

export default function SuperAdminPanelPage({ initialPanelSlug }) {
  return <SuperAdminDashboard initialPanelSlug={initialPanelSlug} />;
}

export function getServerSideProps({ params }) {
  if (isShopPanelSlug(params?.panel)) {
    const panel = Object.keys(shopPanelSlugs).find((key) => shopPanelSlugs[key] === params.panel);
    return { redirect: { destination: shopPanelPath(panel), permanent: false } };
  }
  return typeof params?.panel === "string" ? { props: { initialPanelSlug: params.panel } } : { notFound: true };
}
