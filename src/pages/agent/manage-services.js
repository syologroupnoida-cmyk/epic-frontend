import AgentDashboard from "@/components/dashboard/AgentDashboard";

export default function ManageServicesPage() {
  return <AgentDashboard activePanel="Manage Services" />;
}

export function getServerSideProps() {
  return { redirect: { destination: "/agent/add-services", permanent: false } };
}
