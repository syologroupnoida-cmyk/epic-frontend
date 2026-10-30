import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";

export default function SuperAdminPanelPage({ initialPanelSlug }) {
  return <SuperAdminDashboard initialPanelSlug={initialPanelSlug} />;
}

export function getServerSideProps({ params }) {
  return typeof params?.panel === "string" ? { props: { initialPanelSlug: params.panel } } : { notFound: true };
}
