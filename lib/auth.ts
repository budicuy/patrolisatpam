import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const key = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_key_change_me",
);

export type SessionPayload = {
  id: number;
  username: string;
  role: "admin" | "satpam";
  expiresAt: Date;
};

export async function encrypt(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day session
  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (_error) {
    return null;
  }
}

export async function createSession(
  id: number,
  username: string,
  role: "admin" | "satpam",
) {
  const session = await encrypt({ id, username, role });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sameSite: "lax",
    path: "/",
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    redirect("/login");
  }

  return { isAuth: true, userId: payload.id, role: payload.role };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return await decrypt(session);
}
