import { Clock, LayoutDashboard, LogOut, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";

export default function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg dark:bg-gray-800">
      <div className="flex h-16 items-center justify-center border-b dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Admin Panel
        </h1>
      </div>
      <nav className="p-4 space-y-2">
        <Link
          href="/admin/dashboard"
          className="flex items-center space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/locations"
          className="flex items-center space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <MapPin className="h-5 w-5" />
          <span>Data Tempat</span>
        </Link>
        <Link
          href="/admin/shifts"
          className="flex items-center space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Clock className="h-5 w-5" />
          <span>Data Shift</span>
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Users className="h-5 w-5" />
          <span>Data Satpam</span>
        </Link>

        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          className="pt-8"
        >
          <button
            type="button"
            className="flex w-full items-center space-x-3 rounded-lg px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </form>
      </nav>
    </aside>
  );
}
