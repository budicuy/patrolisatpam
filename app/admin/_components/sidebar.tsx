"use client";

import {
  Clock,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Lokasi Gedung", href: "/admin/locations", icon: MapPin },
  { name: "Shift Jaga", href: "/admin/shifts", icon: Clock },
  { name: "Riwayat Patroli", href: "/admin/history", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-white shadow-lg dark:bg-gray-800">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4 dark:border-gray-700">
        <ShieldCheck className="mr-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
        <span className="text-xl font-bold font-sans text-gray-900 dark:text-white">
          Admin Patroli
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
              )}
            >
              <item.icon
                className={cn(
                  isActive
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300",
                  "mr-3 h-5 w-5 flex-shrink-0",
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut
            className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          Keluar
        </button>
      </div>
    </div>
  );
}
