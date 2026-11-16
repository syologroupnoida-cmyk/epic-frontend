import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import ShopCatalogEditor from '@/modules/ecommerce/management/ShopCatalogEditor';
export default function EditPage({ entryId }) {
  return <SuperAdminDashboard initialPanelSlug="shop-categories"><ShopCatalogEditor key={entryId} kind="category" id={entryId} /></SuperAdminDashboard>;
}
export function getServerSideProps({ params }) {
  const entryId = params?.categoryId;
  return typeof entryId === 'string' && entryId.trim() ? { props: { entryId } } : { notFound: true };
}
