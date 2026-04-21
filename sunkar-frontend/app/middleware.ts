import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes that require login
const isProtectedUserRoute = createRouteMatcher([
  '/story(.*)',
]);

const isProtectedCreatorRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/submit(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;

  // Not logged in — redirect to landing page
  if (!userId && (isProtectedUserRoute(req) || isProtectedCreatorRoute(req))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Logged in but trying to access creator routes without creator role
  if (userId && isProtectedCreatorRoute(req) && role !== 'creator') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};