import VendorDirectory from "@/components/vendor/VendorDirectory";
import { getVendorCategory } from "@/data/vendorDirectory";

export default function MarketplacePage({ category }) {
  return <VendorDirectory category={category} contentKey="marketplace" />;
}

export function getStaticProps() {
  return { props: { category: getVendorCategory("wedding-vendors") } };
}
