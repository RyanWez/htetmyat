import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthPage = nextUrl.pathname.startsWith("/login");

  // Prevent logged-in users from accessing the login page
  if (isAuthPage) {
    if (isLoggedIn) {
      // Do not redirect POST requests (like Server Actions) back to root, 
      // otherwise Next.js client RPC parsing fails. Let them complete naturally.
      if (req.method === 'POST') {
        return null;
      }
      return Response.redirect(new URL("/", nextUrl));
    }
    return null;
  }

  // Protect Admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      // Redirect to login if unauthenticated
      return Response.redirect(new URL("/login", nextUrl));
    }
    if (req.auth?.user?.role !== "admin") {
      // Redirect to home if logged in but not an admin
      return Response.redirect(new URL("/", nextUrl));
    }
  }

  return null;
});

// Match all request paths except for the ones starting with:
// - api (API routes)
// - _next/static (static files)
// - _next/image (image optimization files)
// - _vercel (vercel internals)
// - favicon.ico, sitemap.xml, robots.txt (metadata files)
// - manifest.json, sw.js, worker-* (PWA files)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|_vercel|favicon.ico|manifest.json|sw.js|worker-.*).*)'],
};
