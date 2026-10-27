import { useRouter } from "next/router";
import AgentDashboard from "@/components/dashboard/AgentDashboard";
import EditService from "@/components/vendor/EditService";

export default function EditServicePage() {
  const router = useRouter();
  const id = router.isReady && typeof router.query.listingId === "string" ? router.query.listingId : "";
  return <AgentDashboard activePanel="Edit Service"><EditService listingId={id} /></AgentDashboard>;
}
