export { default } from '@/modules/ecommerce/ShopOrderDetails';

export function getServerSideProps({ params }) {
  return typeof params?.orderId === 'string' && params.orderId.trim() ? { props: { orderId: params.orderId } } : { notFound: true };
}
