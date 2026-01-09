import { getUsers } from "@/app/actions/users";
import { auth } from "@/lib/auth";
import { UserList } from "./_components/user-list";

interface ExtendedUser {
  role?: string;
}

export default async function UsersPage() {
  const users = await getUsers();
  const session = await auth();
  const currentUserRole = (session?.user as ExtendedUser)?.role || "satpam";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Kelola User</h1>
      <UserList users={users} currentUserRole={currentUserRole} />
    </div>
  );
}
