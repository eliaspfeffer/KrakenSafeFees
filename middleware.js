import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  // Überprüfe, ob die Route unter /admin ist
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Wenn der Benutzer nicht angemeldet ist oder nicht der Admin ist, leite zum Dashboard um
    if (!token || token.email !== "eliaspfeffer@googlemail.com") {
      const url = new URL("/dashboard", request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Diese Middleware wird nur für die angegebenen Pfade ausgeführt
export const config = {
  matcher: ["/admin/:path*"],
};
