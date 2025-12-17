"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pencil, Plus, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteUser } from "@/app/actions/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { users } from "@/lib/schema";
import { UserForm } from "./user-form";

type UserListProps = {
  users: (typeof users.$inferSelect)[];
};

export function UserList({ users: initialUsers }: UserListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<
    typeof users.$inferSelect | null
  >(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: typeof users.$inferSelect) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      try {
        await deleteUser(deleteId);
        toast.success("User berhasil dihapus");
        setDeleteId(null);
      } catch (error) {
        toast.error(`Gagal menghapus user: ${error}`);
      }
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah User
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-md dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Nama
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Username
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Role
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Dibuat Pada
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {initialUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {user.createdAt
                        ? format(new Date(user.createdAt), "dd MMM yyyy", {
                            locale: id,
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(user.id)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. User ini akan dihapus
              permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
