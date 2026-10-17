import VendorDirectory from "@/components/vendor/VendorDirectory";
import { getVendorCategory } from "@/data/vendorDirectory";

export default function VendorCategoryPage(props) {
  return <VendorDirectory key={props.category.slug} {...props} />;
}

export function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export function getStaticProps({ params }) {
  const category = getVendorCategory(params.category);
  if (!category) return { notFound: true };
  return { props: { category } };
}
