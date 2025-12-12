import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // Added later in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard =
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/satpam");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Redirect to role-based dashboard if already logged in and on login/home page
        // In middleware, auth is often the decoded token, so we check both locations
        const role = (auth?.user as any)?.role || (auth as any)?.role;

        console.log("Middleware Auth:", JSON.stringify(auth, null, 2));
        console.log("Middleware Role:", role);

        if (role === "ADMIN") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        } else {
          return Response.redirect(new URL("/satpam/dashboard", nextUrl));
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
