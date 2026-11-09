import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Next.js 16 Proxy (formerly Middleware) that protects `/admin` routes and
 * refreshes Supabase Auth cookies when Supabase is configured.
 * Full server-side authorization is also enforced in `requireAdminPage()` and
 * `requireAdminMutation()`.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");
  const hasPasswordCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  const env = getPublicSupabaseEnv();
  if (!env) {
    if (!isLoginRoute && !hasPasswordCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresh the auth token if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isLoginRoute && !hasPasswordCookie && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
