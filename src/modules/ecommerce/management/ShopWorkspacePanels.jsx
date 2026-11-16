import { useEffect, useState } from 'react';
import MainApi from '@/util/MainApi';
import { fetchEcommerceCategories } from '@/util/ecommerceCategories.mjs';
import ShopManagementDashboard from './ShopManagementDashboard';
import EcommerceProductForm from './products/EcommerceProductForm';
import EcommerceProductEditor from './products/EcommerceProductEditor';
import EcommerceInventoryList from './inventory/EcommerceInventoryList';
import EcommerceOrderList from './orders/EcommerceOrderList';

const destinations = { Overview: 'Shop Overview', Products: 'Product List', Categories: 'Category List', Orders: 'Shop Orders' };

export function ShopAddProductPanel({ onNavigate }) {
  return <EcommerceProductForm onCreated={() => onNavigate('Product List')} />;
}

export function ShopOverviewPanel({ onNavigate }) {
  const [categoryCount, setCategoryCount] = useState('...');
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceCategories(MainApi, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setCategoryCount(result.total >= 0 ? result.total : 'View list');
    }).catch(() => { if (!controller.signal.aborted) setCategoryCount('View list'); });
    return () => controller.abort();
  }, []);
  return <ShopManagementDashboard activePanel="Overview" categoryCount={categoryCount} onPanelChange={(panel) => onNavigate(destinations[panel])} />;
}

export function ShopProductsPanel({ onNavigate, productId }) {
  if (productId) return <EcommerceProductEditor key={productId} id={productId} onBack={() => onNavigate('Product List')} />;
  return <ShopManagementDashboard activePanel="Products" onPanelChange={(panel) => onNavigate(destinations[panel])} />;
}

export function ShopOrdersPanel() {
  return <EcommerceOrderList />;
}

export function ShopInventoryPanel() {
  return <EcommerceInventoryList />;
}

export function ShopLowStockPanel() {
  return <EcommerceInventoryList key="low-stock" lowStockOnly />;
}
