import { useEffect, useState } from 'react';
import MainApi from '@/util/MainApi';
import { fetchEcommerceCategories } from '@/util/ecommerceCategories.mjs';
import ShopManagementDashboard from './ShopManagementDashboard';

const destinations = { Overview: 'Shop Overview', Products: 'Shop Products', Categories: 'Category List', Orders: 'Shop Orders' };

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

export function ShopProductsPanel({ onNavigate }) {
  return <ShopManagementDashboard activePanel="Products" onPanelChange={(panel) => onNavigate(destinations[panel])} />;
}

export function ShopOrdersPanel({ onNavigate }) {
  return <ShopManagementDashboard activePanel="Orders" onPanelChange={(panel) => onNavigate(destinations[panel])} />;
}
