import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const payload = await decrypt(session);

  // 1. Redirect unauthenticated users to login if accessing protected routes
  if (
    !payload &&
    (request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/patrol"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users to their dashboard if accessing login
  if (payload && request.nextUrl.pathname.startsWith("/login")) {
    if (payload.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/patrol", request.url));
    }
  }

  // 3. Role-based protection
  if (
    payload &&
    request.nextUrl.pathname.startsWith("/admin") &&
    payload.role !== "admin"
  ) {
    // Satpam trying to access admin
    return NextResponse.redirect(new URL("/patrol", request.url));
  }

  if (
    payload &&
    request.nextUrl.pathname.startsWith("/patrol") &&
    payload.role !== "satpam"
  ) {
    // Admin might want to see patrol view? Maybe allowed, but strict separation for now.
    // Let's allow admin to patrol view if needed, but for now strict.
    // Actually usually admin manages, satpam patrols.
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
