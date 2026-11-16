import UserDashboard from '@/components/dashboard/UserDashboard';
import { OrderList } from '@/modules/ecommerce/ShopOrders';
export default function UserOrdersPage() {
  return <UserDashboard activePanel="My Orders"><OrderList detailsBase="/user/orders" dashboard /></UserDashboard>;
}
