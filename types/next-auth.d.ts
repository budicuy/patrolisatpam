import { Role } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: Role;
      id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    id?: string;
  }
}
