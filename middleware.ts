import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("Middleware - Token state:", {
      is2FAEnabled: token?.is2FAEnabled,
      is2FAVerified: token?.is2FAVerified,
    });

    // Liste des chemins qui ne nécessitent pas d'authentification
    const publicPaths = ["/login"];

    if (publicPaths.includes(path)) {
      return NextResponse.next();
    }

    // Si pas de token, rediriger vers login
    if (!token) {
      console.log("Middleware - No token, redirecting to login");

      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token.is2FAEnabled && !token.is2FAVerified) {
      if (path !== "/verify-2fa") {
        return NextResponse.redirect(new URL("/verify-2fa", req.url));
      }
    } else if (token.is2FAEnabled === false && path === "/setup-2fa") {
      // Permettre l'accès à setup-2fa uniquement si 2FA n'est pas activé
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/setup-2fa|api/auth/verify-2fa).*)",
  ],
};
