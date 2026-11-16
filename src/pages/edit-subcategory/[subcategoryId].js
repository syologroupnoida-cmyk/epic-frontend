import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import ShopCatalogEditor from '@/modules/ecommerce/management/ShopCatalogEditor';
export default function EditPage({ entryId }) {
  return <SuperAdminDashboard initialPanelSlug="shop-subcategories"><ShopCatalogEditor key={entryId} kind="subcategory" id={entryId} /></SuperAdminDashboard>;
}
export function getServerSideProps({ params }) {
  const entryId = params?.subcategoryId;
  return typeof entryId === 'string' && entryId.trim() ? { props: { entryId } } : { notFound: true };
}
