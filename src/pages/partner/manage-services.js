import AgentDashboard from "@/components/dashboard/AgentDashboard";

export default function ManageServicesPage() {
  return <AgentDashboard activePanel="Manage Services" />;
}

export function getServerSideProps() {
  return { redirect: { destination: "/partner/add-services", permanent: false } };
}
