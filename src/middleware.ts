import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/login" && request.method === "GET") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    if (!checkRateLimit(`login-page:${ip}`)) {
      return new NextResponse("محاولات كثيرة جداً. حاول لاحقاً.", { status: 429 });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
