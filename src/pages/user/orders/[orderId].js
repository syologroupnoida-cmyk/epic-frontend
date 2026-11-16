import UserDashboard from '@/components/dashboard/UserDashboard';
import { OrderDetailsContent } from '@/modules/ecommerce/ShopOrderDetails';
export default function UserOrderDetailsPage({ orderId }) {
  return <UserDashboard activePanel="My Orders"><div className="h-full overflow-auto rounded border border-slate-200 bg-white p-5"><OrderDetailsContent key={orderId} orderId={orderId} backHref="/user/orders" /></div></UserDashboard>;
}
export function getServerSideProps({ params }) { return { props: { orderId: String(params.orderId) } }; }
