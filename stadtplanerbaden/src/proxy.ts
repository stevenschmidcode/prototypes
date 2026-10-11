import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * Sprach-Routing
 * - /de/... → 301 auf die kanonische URL ohne Präfix
 * - /en/... → unverändert
 * - alles andere → intern auf /de/... umschreiben (die URL bleibt ohne Präfix)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // API, Next-Interna und statische Dateien (mit Endung) nicht anfassen
  matcher: ["/((?!api|_next|images|icons|sw\\.js|manifest\\.webmanifest|icon\\.png|favicon\\.ico|.*\\..*).*)"],
};
