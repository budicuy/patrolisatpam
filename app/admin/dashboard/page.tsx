import { auth, signOut } from "@/auth";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-100 p-8 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="button"
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </form>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Data Tempat
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage patrol locations and geofencing.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Data Shift
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage work shifts.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Data User
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage security guards.
          </p>
        </div>
      </div>
    </div>
  );
}
