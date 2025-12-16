import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard =
    req.nextUrl.pathname.startsWith("/admin") ||
    req.nextUrl.pathname.startsWith("/patrol");
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");

  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnLogin) {
    if (isLoggedIn) {
      const role = (req.auth?.user as any).role;
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
      } else {
        return NextResponse.redirect(new URL("/patrol", req.nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
