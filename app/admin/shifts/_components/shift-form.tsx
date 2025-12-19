"use client";

import { Plus } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "react-hot-toast";
import { createShift } from "@/app/actions/shifts";

export function ShiftForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createShift(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Shift berhasil ditambahkan");
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Nama Shift
        </label>
        <input
          type="text"
          name="name"
          placeholder="Contoh: Shift Pagi"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700"
          >
            Jam Mulai
          </label>
          <input
            type="time"
            name="startTime"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700"
          >
            Jam Selesai
          </label>
          <input
            type="time"
            name="endTime"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <Plus className="mr-2 h-4 w-4" />
        {isPending ? "Menyimpan..." : "Simpan Shift"}
      </button>
    </form>
  );
}
