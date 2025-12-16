import { getUsers } from "@/app/actions/users";
import { UserList } from "./_components/user-list";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Kelola User</h1>
      <UserList users={users} />
    </div>
  );
}
