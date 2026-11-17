export { default } from '@/modules/ecommerce/ShopPaymentSuccess';

export function getServerSideProps({ params }) {
  return typeof params?.orderId === 'string' && params.orderId.trim() ? { props: { orderId: params.orderId } } : { notFound: true };
}
