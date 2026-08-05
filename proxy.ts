import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export const proxy = convexAuthNextjsMiddleware();

export const config = {
  // The proxy should not run on static files or internal Next.js paths
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
