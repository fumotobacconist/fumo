import { getTranslations } from 'next-intl/server';
import Link from '@/components/site/L';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="wrap empty">
      <h1 className="d outline" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>{t('title')}</h1>
      <p>{t('text')}</p>
      <Link href="/c/all" className="btn">{t('back')}</Link>
    </div>
  );
}
