export { default } from "next-auth/middleware";

// Protect all authenticated app routes. Unauthenticated requests are
// redirected to /login by next-auth middleware (JWT-based).
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/income/:path*",
    "/budget/:path*",
    "/transactions/:path*",
    "/utilities/:path*",
    "/investments/:path*",
    "/ipos/:path*",
    "/loans/:path*",
    "/goals/:path*",
    "/calendar/:path*",
    "/reports/:path*",
    "/net-worth/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
