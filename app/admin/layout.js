import { fontVars } from '@/lib/fonts';
import '../globals.css';
import './admin.css';

export const metadata = { title: 'FUMO Admin', robots: { index: false, follow: false } };
export const viewport = { themeColor: '#ffffff' };

export default function AdminLayout({ children }) {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <div className="adm">{children}</div>
      </body>
    </html>
  );
}
