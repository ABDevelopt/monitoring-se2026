// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'monitoring-se2026-ppu-super-secret-key-at-least-32-chars';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Tentukan path mana saja yang bersifat publik (misal login)
  const isPublicRoute = path === '/login';
  
  // Kecualikan static assets, favicon, dan API routes dari auth check
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  let session: any = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, encodedKey, {
        algorithms: ['HS256'],
      });
      session = payload;
    } catch (e) {
      // Cookie tidak valid / expired, abaikan saja (session tetap null)
    }
  }

  // Jika tidak login dan mencoba mengakses rute terproteksi
  if (!session && !isPublicRoute && path !== '/') {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Rute root "/" redirect ke dashboard jika login, ke login jika tidak
  if (path === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    } else {
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }

  // Jika sudah login dan mencoba mengakses halaman login
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Validasi hak akses role-based
  if (session) {
    const role = session.role;

    // Rute admin (/admin/*) hanya bisa diakses oleh admin
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }

    // Rute rekap (/rekap) dan form input (/form-input) hanya untuk admin, korlap, dan pml (PCL tidak bisa akses)
    if ((path.startsWith('/rekap') || path.startsWith('/form-input')) && role === 'pcl') {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
  }

  return NextResponse.next();
}

// Konfigurasi matcher untuk memproses semua rute kecuali yang dikecualikan
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
