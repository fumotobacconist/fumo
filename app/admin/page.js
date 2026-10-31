import { getBadges, getBrands, getCategories, getPages, getProducts, getSite } from '@/lib/db';
import AdminApp from '@/components/admin/AdminApp';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [products, categories, site, pages, brands, badges] = await Promise.all([getProducts({ includeHidden: true }), getCategories(), getSite(), getPages(), getBrands(), getBadges()]);
  return <AdminApp initial={{ products, categories, site, pages, brands, badges }} />;
}
