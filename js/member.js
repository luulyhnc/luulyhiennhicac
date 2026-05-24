'use strict';
const MEMBER_API = (window.MEMBER_API_OVERRIDE || 'http://localhost:3000') + '/api';

const MEMBER = {
  API: MEMBER_API,
  get token() { return sessionStorage.getItem('_mb_tk') || localStorage.getItem('_mb_tk') || ''; },
  get user()  { try { const r = sessionStorage.getItem('_mb_us') || localStorage.getItem('_mb_us'); return r ? JSON.parse(r) : null; } catch { return null; } },
  get isLoggedIn() { return !!(this.token && this.user); },
  save(token, user, remember) {
    const s = remember ? localStorage : sessionStorage;
    s.setItem('_mb_tk', token); s.setItem('_mb_us', JSON.stringify(user));
  },
  clear() { ['_mb_tk','_mb_us','_mb_stoken','_mb_remember'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); }); },
  async logout() {
    try { await fetch(MEMBER_API + '/auth/logout', { method:'POST', headers: this.token ? {Authorization:'Bearer '+this.token} : {}, credentials:'include' }); } catch {}
    this.clear(); location.href = 'index.html';
  }
};

function _initMemberHeader() {
  // If owner login (auth.js) is active, let auth.js handle the button
  if (typeof AUTH !== 'undefined' && AUTH.isOwner) return;

  const btn = document.querySelector('.btn-login');
  if (!btn) return;

  if (MEMBER.isLoggedIn) {
    const user = MEMBER.user;
    const role = user.role || 'reader';
    const uname = user.username || user.email || 'Thành viên';

    // Role-based label + colour
    let roleIcon, roleLabel, roleColor;
    if (role === 'author') {
      roleIcon  = '✍️'; roleLabel = 'Tác giả';
      roleColor = 'var(--gold,#e8a800)';
    } else if (role === 'pending_author') {
      roleIcon  = '📖'; roleLabel = 'Chờ duyệt';
      roleColor = 'var(--orange,#e07820)';
    } else {
      roleIcon  = '📖'; roleLabel = 'Độc giả';
      roleColor = 'var(--teal,#0ea5a0)';
    }

    btn.textContent = roleIcon + ' ' + uname;
    btn.style.cssText += ';color:' + roleColor + '!important;border-color:' + roleColor + '!important';

    // Create dropdown
    const wrap = btn.parentElement;
    const dd = document.createElement('div');
    dd.id = '_mb_dd';
    dd.style.cssText = [
      'position:absolute','top:calc(100% + 6px)','right:0','min-width:200px',
      'background:#fff','border:1.5px solid var(--border)','border-radius:var(--radius)',
      'box-shadow:var(--shadow-m)','z-index:9999','display:none','overflow:hidden'
    ].join(';');

    // Identity line
    const emailLine = document.createElement('div');
    emailLine.style.cssText = 'padding:.55rem .9rem;font-size:.75rem;color:var(--text3);border-bottom:1px solid var(--border);word-break:break-all';
    emailLine.textContent = user.email || '';

    // Role badge line
    const roleLine = document.createElement('div');
    roleLine.style.cssText = 'padding:.4rem .9rem;font-size:.76rem;font-weight:600;border-bottom:1px solid var(--border);color:' + roleColor;
    roleLine.textContent = roleIcon + ' ' + roleLabel + (role === 'pending_author' ? ' ⏳' : '');

    // Pending note
    let pendingNote = null;
    if (role === 'pending_author') {
      pendingNote = document.createElement('div');
      pendingNote.style.cssText = 'padding:.4rem .9rem;font-size:.72rem;color:var(--text3);border-bottom:1px solid var(--border);line-height:1.4';
      pendingNote.textContent = 'Tài khoản tác giả đang chờ Admin duyệt.';
    }

    const logoutBtn = document.createElement('button');
    logoutBtn.style.cssText = 'width:100%;padding:.55rem .9rem;background:none;border:none;text-align:left;font-size:.83rem;color:var(--red);cursor:pointer;font-family:inherit;';
    logoutBtn.textContent = '🚪 Đăng xuất';
    logoutBtn.onmouseenter = function() { this.style.background = '#fdecea'; };
    logoutBtn.onmouseleave = function() { this.style.background = 'none'; };
    logoutBtn.onclick = function() { MEMBER.logout(); };

    dd.appendChild(emailLine);
    dd.appendChild(roleLine);
    if (pendingNote) dd.appendChild(pendingNote);
    dd.appendChild(logoutBtn);

    // Position wrapper relatively if needed
    const computedPos = getComputedStyle(wrap).position;
    if (computedPos === 'static') wrap.style.position = 'relative';
    wrap.appendChild(dd);

    btn.onclick = function(e) {
      e.stopPropagation();
      dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    };

    document.addEventListener('click', function() {
      dd.style.display = 'none';
    });
  } else {
    btn.onclick = function() { location.href = 'login.html'; };
  }
}

document.addEventListener('DOMContentLoaded', function() {
  requestAnimationFrame(_initMemberHeader);
});

window.MEMBER = MEMBER;
