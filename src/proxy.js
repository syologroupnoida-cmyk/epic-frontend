import { NextResponse } from "next/server";

const ACCESS_TOKEN_KEY = "epic_access_token";
const REFRESH_TOKEN_KEY = "epic_refresh_token";
const AUTH_ROLE_KEY = "epic_auth_role";

const protectedRoutes = [
  {
    prefix: "/kyc",
    loginPath: "/partner/login",
    roles: ["VENDOR"],
  },
  {
    prefix: "/user/dashboard",
    loginPath: "/user/login",
    roles: ["CLIENT"],
  },
  {
    prefix: "/agent",
    loginPath: "/partner/login",
    roles: ["VENDOR"],
    publicPaths: ["/agent", "/agent/login", "/agent/sign-up"],
  },
  {
    prefix: "/partner",
    loginPath: "/partner/login",
    roles: ["VENDOR"],
    publicPaths: ["/partner", "/partner/login", "/partner/sign-up"],
  },
  {
    prefix: "/superadmin",
    loginPath: "/superadmin/login",
    roles: ["SUPER_ADMIN", "ADMIN"],
    publicPaths: ["/superadmin/login"],
  },
];

function getRoute(pathname) {
  return protectedRoutes.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
}

function redirectToLogin(request, loginPath) {
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const route = getRoute(pathname);

  if (!route || route.publicPaths?.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;
  const role = request.cookies.get(AUTH_ROLE_KEY)?.value;
  const hasSession = Boolean(accessToken && refreshToken);
  const hasAllowedRole = route.roles.includes(role);

  if (!hasSession || !hasAllowedRole) {
    return redirectToLogin(request, route.loginPath);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/dashboard/:path*",
    "/partner/:path*",
    "/superadmin/:path*",
    "/kyc/:path*",
  ],
};
