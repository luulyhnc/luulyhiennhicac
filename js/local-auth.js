'use strict';
/**
 * LocalAuth — browser-only member auth via localStorage + SubtleCrypto.
 * Used when the API backend is unavailable (GitHub Pages static hosting).
 * Passwords are SHA-256 hashed client-side before storage (never stored plain).
 */
const LocalAuth = (() => {
  const USERS_KEY = '_llhnc_lusers';
  const SALT      = '_llhnc_2026';   // static salt keeps hashes site-specific

  // ── helpers ──────────────────────────────────────────────
  function _getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch { return []; }
  }
  function _saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  async function _hashPw(pw) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(pw + SALT));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function _uid() {
    return (typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // ── public API ────────────────────────────────────────────
  /**
   * Register a new member.
   * @param {{ email, username, password, fullName?, wantsAuthor? }} opts
   * @returns {{ ok, message?, user? }}
   */
  async function register({ email, username, password, fullName = '', wantsAuthor = false }) {
    const users      = _getUsers();
    const emailLow   = email.toLowerCase().trim();
    const unameLow   = username.toLowerCase().trim();

    // SECURITY: generic message — don't leak which field conflicts
    if (users.find(u => u.email === emailLow || u.username.toLowerCase() === unameLow)) {
      return { ok: false, message: 'Email hoặc tên đăng nhập đã được sử dụng.' };
    }

    const passwordHash = await _hashPw(password);
    const role         = wantsAuthor ? 'pending_author' : 'reader';

    const user = {
      id:           _uid(),
      email:        emailLow,
      username:     username.trim(),
      fullName:     fullName.trim(),
      passwordHash,
      role,
      createdAt:    new Date().toISOString(),
    };
    users.push(user);
    _saveUsers(users);

    return {
      ok:   true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  /**
   * Login — accepts username OR email.
   * @param {{ identifier, password }} opts
   * @returns {{ ok, message?, accessToken?, user? }}
   */
  async function login({ identifier, password }) {
    const users = _getUsers();
    const id    = identifier.toLowerCase().trim();
    const user  = users.find(u => u.email === id || u.username.toLowerCase() === id);

    // SECURITY: always hash so timing is similar whether user exists or not
    const passwordHash = await _hashPw(password);

    if (!user || passwordHash !== user.passwordHash) {
      return { ok: false, message: 'Thông tin đăng nhập không chính xác.' };
    }

    return {
      ok:          true,
      accessToken: 'local_' + _uid(),
      user:        { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  /**
   * Update user role (called by admin to approve pending_author → author).
   * @param {string} userId
   * @param {string} newRole
   */
  function setRole(userId, newRole) {
    const users = _getUsers();
    const user  = users.find(u => u.id === userId);
    if (user) { user.role = newRole; _saveUsers(users); }
  }

  /** Get all registered users (for admin panel). */
  function getAllUsers() {
    return _getUsers().map(u => ({
      id: u.id, email: u.email, username: u.username,
      fullName: u.fullName, role: u.role, createdAt: u.createdAt,
    }));
  }

  return { register, login, setRole, getAllUsers };
})();

window.LocalAuth = LocalAuth;
