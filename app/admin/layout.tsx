import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
