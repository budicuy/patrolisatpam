"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";

export function AdminLayoutShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null };
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="flex min-h-dvh bg-gray-100 text-gray-900 relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden w-full h-full cursor-default"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Content Area */}
      <div className="flex-1 md:pl-64 w-full flex flex-col min-h-dvh transition-all duration-200">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="ml-4 text-lg font-semibold text-gray-900">
            {user?.name || "Patroli"}
          </span>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
