import AgentDashboard from "@/components/dashboard/AgentDashboard";
import { agentPanelFromSlug, agentPanelPath } from "@/util/agentDashboardRoutes.mjs";

export default function AgentDashboardPage() {
  return <AgentDashboard />;
}

export function getServerSideProps({ query }) {
  if (query.panel !== undefined) {
    const panel = agentPanelFromSlug(query.panel);
    if (!panel) return { notFound: true };
    return { redirect: { destination: agentPanelPath(panel), permanent: false } };
  }
  return { props: {} };
}
