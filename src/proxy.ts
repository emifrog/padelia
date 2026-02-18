import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// CSP without nonce — Next.js does not reliably propagate nonces to all its inline scripts.
// unsafe-inline is required for Next.js inline scripts; unsafe-eval for Mapbox GL JS (WebGL shaders).
// Domain allowlists + base-uri/form-action/object-src provide strong protection against XSS injection.
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.mapbox.com https://*.stripe.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://*.mapbox.com https://api.stripe.com https://events.mapbox.com",
  "frame-src https://js.stripe.com https://*.supabase.co",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export async function proxy(request: NextRequest) {
  // --- 1. Set CSP on request headers ---
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', CSP_HEADER);

  // --- 2. Supabase session refresh ---
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/callback');

  // If not authenticated and trying to access protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirect = NextResponse.redirect(url);
    redirect.headers.set('Content-Security-Policy', CSP_HEADER);
    return redirect;
  }

  // If authenticated, check onboarding
  if (user && !isPublicPath && !pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', user.id)
      .single();

    if (profile && !profile.is_onboarded) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      const redirect = NextResponse.redirect(url);
      redirect.headers.set('Content-Security-Policy', CSP_HEADER);
      return redirect;
    }
  }

  // If authenticated and on public path, redirect to home
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/accueil';
    const redirect = NextResponse.redirect(url);
    redirect.headers.set('Content-Security-Policy', CSP_HEADER);
    return redirect;
  }

  // --- 3. Set CSP on response ---
  supabaseResponse.headers.set('Content-Security-Policy', CSP_HEADER);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, manifest, icons, sw
     * - public files (svg, png, jpg, etc.)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
