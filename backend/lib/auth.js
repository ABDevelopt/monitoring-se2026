// backend/lib/auth.js
// Auth library: JWT sign/verify + cookie helper untuk Express

const { SignJWT, jwtVerify } = require('jose');

const SECRET_KEY = process.env.JWT_SECRET || 'monitoring-se2026-ppu-super-secret-key-at-least-32-chars';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

/**
 * Buat JWT token dari payload user
 */
async function encrypt(payload) {
  const payloadToSign = {
    ...payload,
    expiresAt: payload.expiresAt instanceof Date
      ? payload.expiresAt.toISOString()
      : payload.expiresAt,
  };

  return new SignJWT(payloadToSign)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

/**
 * Verifikasi dan decode JWT token
 */
async function decrypt(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Buat session cookie di response Express
 */
async function createSession(res, user) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
  const token = await encrypt({
    userId: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    idKecamatan: user.idKecamatan,
    expiresAt,
  });

  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return token;
}

/**
 * Ambil session dari cookie request Express
 */
async function getSession(req) {
  const token = req.cookies?.session;
  if (!token) return null;
  return decrypt(token);
}

/**
 * Hapus session cookie
 */
function deleteSession(res) {
  res.clearCookie('session', { path: '/' });
}

/**
 * Express middleware: wajib login
 */
async function requireAuth(req, res, next) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Tidak terautorisasi' });
  }
  req.session = session;
  next();
}

/**
 * Express middleware: wajib role admin
 */
async function requireAdmin(req, res, next) {
  const session = await getSession(req);
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ error: 'Tidak terautorisasi' });
  }
  req.session = session;
  next();
}

module.exports = {
  encrypt,
  decrypt,
  createSession,
  getSession,
  deleteSession,
  requireAuth,
  requireAdmin,
};
