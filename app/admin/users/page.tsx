"use client";

import { Edit, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  password?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/users/${formData.id}` : "/api/users";
    const method = isEditing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setIsModalOpen(false);
    fetchUsers();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    }
  };

  const resetForm = () => {
    setFormData({ role: "SATPAM" });
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormData({ ...user, password: "" }); // Don't show password hash
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Data Satpam & Admin
        </h1>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Tambah User
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {user.username}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="mr-2 text-blue-600 hover:text-blue-900 dark:text-blue-400"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">
              {isEditing ? "Edit User" : "Tambah User"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={formData.username || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role || "SATPAM"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="SATPAM">Satpam</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password{" "}
                  {isEditing && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <input
                  id="password"
                  type="password"
                  required={!isEditing}
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
