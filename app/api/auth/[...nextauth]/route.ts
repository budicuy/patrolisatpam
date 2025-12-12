import { handlers } from "@/auth"; // Referring to auth.ts in root (aliased as @/auth if tsconfig supports it, otherwise relative)

export const { GET, POST } = handlers;
