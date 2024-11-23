import { AdminCheck } from './components/AdminCheck';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminCheck>{children}</AdminCheck>;
} 