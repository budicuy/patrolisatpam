"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { createUser, updateUser } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { users } from "@/lib/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().optional(),
  role: z.enum(["admin", "satpam"]),
});

type UserFormProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: typeof users.$inferSelect | null; // Pass user for edit mode
};

export function UserForm({ isOpen, onClose, user }: UserFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      password: "",
      role: user?.role || "satpam",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        let result: { success?: boolean; error?: string } | undefined;
        if (user) {
          result = await updateUser(user.id, values);
        } else {
          if (!values.password) {
            form.setError("password", { message: "Password wajib diisi" });
            return;
          }
          result = await createUser(values as typeof users.$inferInsert);
        }

        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(
            user ? "User berhasil diperbarui" : "User berhasil dibuat",
          );
          onClose();
          form.reset();
        }
      } catch {
        toast.error("Terjadi kesalahan");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Tambah User Baru"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Budi Santoso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="budi123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {user
                      ? "Password (Kosongkan jika tidak diubah)"
                      : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="satpam">Satpam</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
