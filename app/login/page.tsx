"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Patroli Satpam
          </CardTitle>
          <CardDescription>
            Masuk untuk memulai sesi patroli atau memantau keamanan
          </CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500 font-medium text-center">
                {state.error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={pending}
            >
              {pending ? "Memproses..." : "Masuk"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
