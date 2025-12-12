"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { authenticate } from "@/app/lib/actions";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 p-3 dark:bg-blue-900">
            <ShieldCheck className="h-10 w-10 text-blue-600 dark:text-blue-300" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Patroli Satpam
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Silakan masuk untuk melanjutkan
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Ingat saya
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-gray-900"
            >
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Masuk
            </button>
          </div>

          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <p className="text-sm text-red-500 dark:text-red-400">
                {errorMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
