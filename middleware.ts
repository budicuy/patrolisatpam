import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface ExtendedUser {
  role?: string;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isOnAdmin = pathname.startsWith("/admin");
  const isOnPatrol = pathname.startsWith("/patrol");
  const isOnLogin = pathname.startsWith("/login");
  const isProtectedRoute = isOnAdmin || isOnPatrol;

  // Get user role if logged in
  const user = req.auth?.user as ExtendedUser | undefined;
  const role = user?.role;

  // If accessing protected routes
  if (isProtectedRoute) {
    // Not logged in -> redirect to login
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Role-based access control
    if (isOnAdmin && role !== "admin") {
      // Satpam trying to access admin routes -> redirect to patrol
      return NextResponse.redirect(new URL("/patrol", req.nextUrl));
    }

    if (isOnPatrol && role === "admin") {
      // Admin trying to access patrol routes -> redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
    }

    return NextResponse.next();
  }

  // If on login page and already logged in -> redirect based on role
  if (isOnLogin && isLoggedIn) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/patrol", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
