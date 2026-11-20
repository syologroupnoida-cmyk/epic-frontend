import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

export default function EditProductPage({ productId }) {
  return <SuperAdminDashboard initialPanelSlug="shop-products" productId={productId} />;
}

export function getServerSideProps({ params }) {
  return typeof params?.productId === 'string' && params.productId.trim() ? { props: { productId: params.productId } } : { notFound: true };
}
