/* ================================================================
   auth.js – Owner Login · GitHub API · Inline Edit Mode
   Lưu Ly Hiền Nhi Các | luulyhnc.github.io/luulyhiennhicac
================================================================ */
'use strict';

// ── Constants ──────────────────────────────────────────────────
const OWNER_EMAIL = 'lethuhien211094@gmail.com';
const GH_REPO     = 'luulyhnc/luulyhiennhicac';
const DATA_FILE    = 'data/stories.json';
const MEMBERS_FILE = 'data/members.json';
const _SK          = '_llhnc_s';   // session key
const _PK         = '_llhnc_p';   // PAT key
const _RK         = '_llhnc_r';   // remember key (email + remember flag)

// ── AUTH ───────────────────────────────────────────────────────
const AUTH = {
  get isOwner() {
    try { const s = JSON.parse(localStorage.getItem(_SK)||'{}'); return !!(s.ok && Date.now() < s.exp); }
    catch { return false; }
  },
  get pat() { return localStorage.getItem(_PK) || ''; },

  async login(email, pat) {
    // Step 1: verify PAT is valid and belongs to the repo owner
    // (We do NOT hard-check email here — GitHub API is the authority)
    const repoOwner = GH_REPO.split('/')[0]; // 'luulyhnc'
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization:`token ${pat}`, Accept:'application/vnd.github.v3+json' }
    });
    if (!userRes.ok) {
      const e = await userRes.json().catch(()=>({}));
      throw new Error(e.message || `PAT không hợp lệ hoặc đã hết hạn (${userRes.status}). Hãy tạo PAT mới trên GitHub Settings.`);
    }
    const ghUser = await userRes.json();
    if (ghUser.login.toLowerCase() !== repoOwner.toLowerCase())
      throw new Error(`PAT không thuộc về tài khoản quản trị (${repoOwner}). Vui lòng dùng PAT của đúng tài khoản.`);

    // Step 2: verify write access to repo
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}`, {
      headers: { Authorization:`token ${pat}`, Accept:'application/vnd.github.v3+json' }
    });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.message || `Không thể truy cập repo (${r.status}). Kiểm tra lại PAT.`);
    }
    const repo = await r.json();
    if (!repo.permissions?.push)
      throw new Error('PAT không có quyền ghi vào repo. Cần scope: Contents → Read and write.');
    localStorage.setItem(_PK, pat);
    localStorage.setItem(_SK, JSON.stringify({ ok:true, exp: Date.now() + 30*864e5 }));
  },

  logout() {
    [_SK, _PK].forEach(k => localStorage.removeItem(k));
    location.reload();
  },

  // ── GitHub API ──────────────────────────────────────────────
  async ghGet(path) {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      headers: { Authorization:`token ${this.pat}`, Accept:'application/vnd.github.v3+json' }
    });
    if (!r.ok) throw new Error(`Lỗi GitHub GET (${r.status}): ${path}`);
    return r.json();
  },

  async ghPut(path, content, msg, sha) {
    const b64 = typeof content === 'string'
      ? btoa(unescape(encodeURIComponent(content)))
      : content; // already base64
    const body = { message: msg, content: b64 };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization:`token ${this.pat}`,
        Accept:'application/vnd.github.v3+json',
        'Content-Type':'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.message || `GitHub PUT error (${r.status})`); }
    return r.json();
  },

  async loadStories() {
    const info   = await this.ghGet(DATA_FILE);
    const binary = atob(info.content.replace(/\n/g,''));
    const json   = decodeURIComponent(escape(binary)); // proper UTF-8 decode
    return { stories: JSON.parse(json), sha: info.sha };
  },

  // PUT a pre-base64-encoded binary file (images, etc.) directly
  async ghPutRaw(path, b64content, msg, sha) {
    const body = { message: msg, content: b64content };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization:`token ${this.pat}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.message||`GitHub PUT error (${r.status})`); }
    return r.json();
  },

  async saveStories(stories, sha, msg = 'Online: cập nhật truyện') {
    return this.ghPut(DATA_FILE, JSON.stringify(stories, null, 2), msg, sha);
  },

  async loadMembers() {
    try {
      const info   = await this.ghGet(MEMBERS_FILE);
      const binary = atob(info.content.replace(/\n/g,''));
      const json   = decodeURIComponent(escape(binary));
      return { members: JSON.parse(json), sha: info.sha };
    } catch(e) {
      // File may not exist yet — treat as empty list
      return { members: [], sha: null };
    }
  },

  async saveMembers(members, sha, msg = 'Online: cập nhật thành viên') {
    return this.ghPut(MEMBERS_FILE, JSON.stringify(members, null, 2), msg, sha);
  }
};

// ── Login Modal (injected once) ────────────────────────────────
function _injectModal() {
  if (document.getElementById('_lm')) return;
  document.body.insertAdjacentHTML('beforeend', `
<div id="_lm" onclick="if(event.target===this)this.style.display='none'"
  style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:16px;padding:2rem;width:90%;max-width:400px;box-shadow:0 16px 60px rgba(0,0,0,.25)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem">
      <b style="font-size:1.05rem;color:#1a2535">🌸 Đăng Nhập Admin</b>
      <button onclick="document.getElementById('_lm').style.display='none'"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:.9rem">✕</button>
    </div>
    <div style="margin-bottom:.85rem">
      <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">Email</div>
      <input id="_le" type="email" placeholder="lethuhien211094@gmail.com"
        onkeydown="if(event.key==='Enter')_doLogin()"
        style="width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box">
    </div>
    <div style="margin-bottom:1rem">
      <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">GitHub Personal Access Token</div>
      <div style="position:relative">
        <input id="_lp" type="password" placeholder="ghp_..."
          onkeydown="if(event.key==='Enter')_doLogin()"
          style="width:100%;padding:.5rem 2.2rem .5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box">
        <button type="button" onclick="_togglePat()"
          style="position:absolute;right:.45rem;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;font-size:.85rem;color:#9fb8cc;padding:0" title="Hiện/Ẩn">👁</button>
      </div>
      <div style="font-size:.72rem;color:#9fb8cc;margin-top:.3rem">
        Tạo tại <a href="https://github.com/settings/tokens/new?scopes=repo&description=LLHNC-Admin"
          target="_blank" style="color:#3ab3ca">GitHub Settings → Tokens</a> (scope: <b>repo</b>)
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:.45rem;font-size:.8rem;color:#4a6080;margin-bottom:.85rem;cursor:pointer;user-select:none">
      <input type="checkbox" id="_lrem" style="width:15px;height:15px;accent-color:#3ab3ca;cursor:pointer">
      Ghi nhớ đăng nhập trên thiết bị này
    </label>
    <div id="_lerr" style="display:none;background:#fdecea;color:#e74c3c;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-bottom:.7rem"></div>
    <button id="_lbtn" onclick="_doLogin()"
      style="width:100%;padding:.58rem;background:#3ab3ca;color:#fff;border:none;border-radius:8px;font-size:.92rem;font-weight:600;cursor:pointer;font-family:inherit">
      🔐 Đăng nhập
    </button>
  </div>
</div>`);
}

function _togglePat() {
  const inp = document.getElementById('_lp');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function _prefillLoginModal() {
  try {
    const saved = JSON.parse(localStorage.getItem(_RK) || '{}');
    if (saved.email) {
      const le = document.getElementById('_le');
      if (le) le.value = saved.email;
    }
    if (saved.pat) {
      const lp = document.getElementById('_lp');
      if (lp) lp.value = saved.pat;
    }
    if (saved.remember) {
      const cb = document.getElementById('_lrem');
      if (cb) cb.checked = true;
    }
  } catch(_) {}
}

async function _doLogin() {
  const email  = document.getElementById('_le').value.trim();
  const pat    = document.getElementById('_lp').value.trim();
  const rem    = document.getElementById('_lrem')?.checked || false;
  const err    = document.getElementById('_lerr');
  const btn    = document.getElementById('_lbtn');
  err.style.display = 'none';
  btn.textContent = '⏳ Đang xác thực...'; btn.disabled = true;
  try {
    await AUTH.login(email, pat);
    // Save credentials if "remember me" checked
    if (rem) {
      localStorage.setItem(_RK, JSON.stringify({ email, pat, remember: true }));
    } else {
      localStorage.removeItem(_RK);
    }
    btn.textContent = '✅ Xác thực xong!';
    setTimeout(() => location.reload(), 600);
  } catch(e) {
    err.textContent = e.message; err.style.display = 'block';
    btn.textContent = '🔐 Đăng nhập'; btn.disabled = false;
  }
}

// ── Header owner badge ─────────────────────────────────────────
function _initHeader() {
  document.querySelectorAll('.btn-login').forEach(btn => {
    if (AUTH.isOwner) {
      btn.removeAttribute('onclick');           // strip any hardcoded onclick="alert(…)"
      btn.textContent = '👑 Admin ▾';
      btn.style.background    = '#27ae60';
      btn.style.borderColor   = '#27ae60';
      btn.style.color         = '#fff';
      btn.onclick = function(e) {
        e.stopPropagation();
        const old = document.getElementById('_omenu');
        if (old) { old.remove(); return; }

        const rc = btn.getBoundingClientRect();
        const m  = document.createElement('div');
        m.id = '_omenu';
        m.style.cssText = [
          'position:fixed',
          'top:'+(rc.bottom+5)+'px',
          'right:'+(window.innerWidth-rc.right)+'px',
          'background:#fff',
          'border-radius:10px',
          'box-shadow:0 6px 28px rgba(0,0,0,.18)',
          'z-index:10000',
          'min-width:220px',
          'overflow:hidden',
          "font-family:'Inter',sans-serif",
          'border:1.5px solid #e0ecf5',
        ].join(';');

        // Helper: create a menu row
        function _row(html, color, onClick) {
          const el = document.createElement(onClick ? 'button' : 'a');
          el.innerHTML = html;
          el.style.cssText = [
            'display:block','width:100%','padding:.68rem 1.1rem',
            'font-size:.86rem','text-align:left','text-decoration:none',
            'background:none','border:none','cursor:pointer',
            "font-family:'Inter',sans-serif",
            'color:'+(color||'#1a2535'),
            'transition:background .13s',
          ].join(';');
          el.onmouseenter = function() { this.style.background='#f0f7fc'; };
          el.onmouseleave = function() { this.style.background='none'; };
          if (onClick) el.onclick = function() { m.remove(); onClick(); };
          return el;
        }
        function _sep() {
          const d = document.createElement('div');
          d.style.cssText = 'height:1px;background:#eef3f7;margin:.2rem 0';
          return d;
        }

        // ── Menu items ──
        const aPanel = _row('⚙️ &nbsp;Admin Panel');
        aPanel.href = 'admin.html';
        aPanel.onclick = function() { m.remove(); };

        const aStory = _row('➕ &nbsp;Đăng truyện');
        aStory.href = 'admin.html';
        aStory.onclick = function() { sessionStorage.setItem('_adm_tab','addstory'); m.remove(); };

        const aMember = _row('👥 &nbsp;Quản lý thành viên');
        aMember.href = 'admin.html';
        aMember.onclick = function() { sessionStorage.setItem('_adm_tab','members'); m.remove(); };

        const bAI = _row('🤖 &nbsp;AI Kiểm duyệt', null,
          function() { if (typeof _openAiModeration==='function') _openAiModeration(); });

        m.appendChild(aPanel);
        m.appendChild(aStory);
        m.appendChild(aMember);
        m.appendChild(_sep());
        m.appendChild(bAI);

        if (typeof downloadNewsletterExcel === 'function') {
          m.appendChild(_row('📥 &nbsp;Tải email đăng ký (.csv)', null,
            function() { downloadNewsletterExcel(); }));
        }

        m.appendChild(_sep());
        m.appendChild(_row('🚪 &nbsp;Đăng xuất', '#e74c3c',
          function() { AUTH.logout(); }));

        document.body.appendChild(m);

        // Close on outside click
        setTimeout(function() {
          function _outside(ev) {
            if (!m.contains(ev.target) && ev.target !== btn) {
              m.remove();
              document.removeEventListener('click', _outside);
            }
          }
          document.addEventListener('click', _outside);
        }, 0);
      };

      // Nút Đăng xuất riêng — luôn hiển thị ngay cạnh Admin
      if (!document.getElementById('_logout_btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = '_logout_btn';
        logoutBtn.textContent = '🚪 Đăng xuất';
        logoutBtn.style.cssText = [
          'background:transparent',
          'color:#e05060',
          'border:1.5px solid #e05060',
          'border-radius:24px',
          'padding:.4rem 1rem',
          'font-size:.83rem',
          'font-weight:700',
          'font-family:inherit',
          'cursor:pointer',
          'white-space:nowrap',
          'flex-shrink:0',
          'transition:all .2s',
          'margin-left:.4rem',
        ].join(';');
        logoutBtn.onmouseenter = () => { logoutBtn.style.background='#e05060'; logoutBtn.style.color='#fff'; };
        logoutBtn.onmouseleave = () => { logoutBtn.style.background='transparent'; logoutBtn.style.color='#e05060'; };
        logoutBtn.onclick = () => {
          if (confirm('Đăng xuất khỏi chế độ Admin?')) AUTH.logout();
        };
        btn.insertAdjacentElement('afterend', logoutBtn);
      }
    } else {
      // Non-owner: go to member login page
      btn.removeAttribute('onclick');
      btn.onclick = function() { location.href = 'login.html'; };
    }
  });
}

// ── Story page: owner edit bar + chapter edit buttons ──────────
function initStoryEditMode(story) {
  const root = document.getElementById('story-detail-root');
  if (!root) return;

  // Floating edit bar
  if (!document.getElementById('_oe_bar')) {
    const bar = document.createElement('div');
    bar.id = '_oe_bar';
    bar.className = 'owner-edit-bar';
    bar.innerHTML = `
      <span class="oe-badge">👑 Owner Mode</span>
      <button class="oe-btn" onclick="openStoryEditor('${story.id}')">✏️ Sửa truyện</button>
      <button class="oe-btn" onclick="openAddChapter('${story.id}')">➕ Thêm chương</button>
      <button class="oe-btn oe-danger" onclick="deleteStoryOnline('${story.id}')">🗑️ Xóa</button>`;
    root.insertAdjacentElement('beforebegin', bar);
  }

  // Inline edit icon directly next to story title in the card
  const titleH1 = document.querySelector('.story-info h1');
  if (titleH1 && !titleH1.querySelector('._oe_inline')) {
    const editBtn = document.createElement('button');
    editBtn.className = '_oe_inline';
    editBtn.title = 'Sửa thông tin truyện';
    editBtn.textContent = '✏️ Sửa';
    editBtn.style.cssText = 'background:#e8f5e9;border:1.5px solid #a8d5b5;border-radius:7px;padding:.2rem .6rem;font-size:.78rem;font-weight:600;color:#27ae60;cursor:pointer;margin-left:.6rem;vertical-align:middle;font-family:inherit';
    editBtn.onclick = () => openStoryEditor(story.id);
    titleH1.appendChild(editBtn);
  }

  // Watch chapter list for re-renders (handles sort/pagination)
  const sec = document.getElementById('chapter-list-section');
  if (sec) {
    const addBtns = () => {
      sec.querySelectorAll('.chap-item').forEach(item => {
        if (item.querySelector('._cedit')) return;
        const titleEl = item.querySelector('.chap-title');
        if (!titleEl) return;
        const ch = story.chapters.find(c => c.title === titleEl.textContent);
        if (!ch) return;
        const b = document.createElement('button');
        b.className = '_cedit chap-edit-btn';
        b.textContent = '✏️';
        b.title = 'Sửa chương';
        b.onclick = e => { e.stopPropagation(); openChapterEditor(story.id, ch.id); };
        item.appendChild(b);
      });
    };
    addBtns();
    new MutationObserver(addBtns).observe(sec, { childList: true, subtree: true });
  }
}

// ── Reader page: inline chapter edit button ────────────────────
function initReaderEditMode(story, chapter, idx) {
  const body = document.getElementById('chapter-body');
  if (!body || document.getElementById('_re_bar')) return;
  body.insertAdjacentHTML('beforebegin', `
    <div id="_re_bar" class="owner-edit-bar" style="margin-bottom:.6rem">
      <span class="oe-badge">👑 Owner</span>
      <button class="oe-btn" onclick="openChapterEditorInline('${story.id}',${chapter.id})">✏️ Sửa chương này</button>
    </div>`);
}

// ── Story editor modal ─────────────────────────────────────────
window._seNewChapters = []; // buffer for bulk-uploaded chapters

function openStoryEditor(storyId) {
  window._seNewChapters = [];
  const s = window._currentStory;
  if (!s) { alert('Không tải được dữ liệu. Thử tải lại trang.'); return; }
  if (document.getElementById('_se_modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
<div id="_se_modal" onclick="if(event.target===this)this.remove()"
  style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:14px;padding:1.5rem;width:90%;max-width:540px;max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
      <b>✏️ Sửa thông tin truyện</b>
      <button onclick="document.getElementById('_se_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button>
    </div>
    ${_fld('Tên truyện','se_t',s.title)}
    ${_fld('Tác giả','se_a',s.author)}
    <div style="margin-bottom:.85rem">
      <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">Ảnh bìa</div>
      <div style="display:flex;gap:.5rem;align-items:flex-start">
        <div style="flex:1">
          <input id="se_c" type="text" value="${_ea(s.cover||'')}" placeholder="https://…/cover.jpg"
            oninput="const p=document.getElementById('se_prev');p.src=this.value;p.style.display=this.value?'block':'none'"
            style="width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box">
          <div style="display:flex;gap:.4rem;margin-top:.28rem;align-items:center">
            <label style="cursor:pointer;padding:.22rem .65rem;background:#f0f4f8;border:1.5px solid #c5dce9;border-radius:6px;font-size:.75rem;font-weight:600;white-space:nowrap">
              📂 Upload ảnh
              <input type="file" accept="image/*" style="display:none" onchange="_uploadCoverFile(this,'se_c','_se_cu')">
            </label>
            <span id="_se_cu" style="font-size:.71rem;color:#9fb8cc"></span>
          </div>
        </div>
        <img id="se_prev" src="${_ea(s.cover||'')}" alt="" style="width:44px;height:60px;object-fit:cover;border-radius:4px;border:1.5px solid #c5dce9;flex-shrink:0;${s.cover?'':'display:none'}">
      </div>
    </div>
    ${_fld('Giới thiệu','se_d',s.description||'','textarea')}
    <style>.se-gpill input{display:none}.se-gpill label{cursor:pointer;padding:.2rem .6rem;border:1.5px solid #c5dce9;border-radius:20px;font-size:.77rem;font-weight:600;color:#4a6080;background:#fff;transition:all .14s;user-select:none;white-space:nowrap;display:inline-block}.se-gpill input:checked+label{background:#3ab3ca;color:#fff;border-color:#3ab3ca}.se-gpill label:hover{border-color:#3ab3ca;color:#3ab3ca}.se-gpill input:checked+label:hover{opacity:.82;color:#fff}</style>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-bottom:.85rem">
      ${_sel('Trạng thái','se_st',['Đang ra','Hoàn thành','Tạm dừng'],s.status)}
      ${_sel('Nguồn','se_src',['Sáng tác','Dịch','ST'],s.source||'Sáng tác')}
    </div>
    <div style="margin-bottom:.85rem">
      <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">Thể loại</div>
      <div id="se_genre" style="display:flex;flex-wrap:wrap;gap:.3rem">${
        (() => {
          const cur = Array.isArray(s.genre) ? s.genre : (s.genre ? [s.genre] : []);
          return ['Tiên Hiệp','Huyền Huyễn','Ngôn Tình','Đô Thị','Nữ Cường','Kiếm Hiệp','Lịch Sử','Khác'].map((g,i) =>
            `<span class="se-gpill"><input type="checkbox" id="seg${i}" name="se_genre" value="${g}"${cur.includes(g)?' checked':''}><label for="seg${i}">${g}</label></span>`
          ).join('');
        })()
      }</div>
    </div>
    ${_fld('Tags phụ (phân cách bởi dấu phẩy)','se_tags',(s.tags||[]).join(', '))}

    <!-- ── Upload chapters ── -->
    <div style="border:1.5px solid #dce8f5;border-radius:10px;overflow:hidden;margin-bottom:.85rem">
      <div style="background:#f0f7fc;padding:.5rem .9rem;font-size:.78rem;font-weight:700;color:#3a5a80;border-bottom:1.5px solid #dce8f5;display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none"
           onclick="const a=document.getElementById('_se_chap_area');a.style.display=a.style.display==='none'?'':'none'">
        📚 Upload / Nhập chương
        <span style="font-weight:400;font-size:.68rem;color:#9fb8cc">Nhấn để mở ▼</span>
      </div>
      <div id="_se_chap_area" style="display:none;padding:.8rem">
        <div style="font-size:.73rem;color:#9fb8cc;margin-bottom:.55rem;line-height:1.6">
          Chọn nhiều file <b>.txt / .docx</b> (1 file = 1 chương), hoặc 1 file <b>.txt</b> có các khối
          <code style="background:#f0f4f8;padding:.05rem .3rem;border-radius:3px;font-size:.7rem">@@CHUONG 1</code> … để nhập nhiều chương cùng lúc.
        </div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin-bottom:.55rem">
          <label style="cursor:pointer;padding:.34rem .85rem;background:#3ab3ca;color:#fff;border-radius:7px;font-size:.79rem;font-weight:600;display:inline-block;white-space:nowrap">
            📂 Chọn file(s)
            <input type="file" id="_se_chap_inp" multiple accept=".txt,.docx,.doc" style="display:none" onchange="_seParseChapFiles(this)">
          </label>
          <button type="button" onclick="_seDownloadChapTemplate()"
            style="padding:.34rem .8rem;background:#fff;border:1.5px solid #c5dce9;border-radius:7px;font-size:.78rem;font-weight:600;color:#4a6080;cursor:pointer;font-family:inherit;white-space:nowrap">
            📥 File mẫu
          </button>
          <select id="_se_chap_mode"
            style="padding:.34rem .6rem;border:1.5px solid #c5dce9;border-radius:7px;font-size:.78rem;color:#4a6080;background:#fff;font-family:inherit;cursor:pointer">
            <option value="append">➕ Thêm vào cuối</option>
            <option value="replace">🔄 Thay thế tất cả chương cũ</option>
          </select>
        </div>
        <div id="_se_chap_st" style="font-size:.73rem;color:#9fb8cc;margin-bottom:.35rem"></div>
        <div id="_se_chap_preview" style="display:none;max-height:180px;overflow-y:auto;border:1.5px solid #dce8f5;border-radius:8px;background:#fafcff;padding:.5rem .7rem;font-size:.76rem;color:#4a6080"></div>
      </div>
    </div>

    <div id="_se_msg" style="display:none;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-bottom:.7rem"></div>
    <div style="display:flex;gap:.5rem;justify-content:flex-end">
      <button onclick="document.getElementById('_se_modal').remove()"
        style="padding:.5rem 1rem;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;background:#fff;font-family:inherit">Hủy</button>
      <button onclick="_saveStoryEdits('${storyId}')"
        style="padding:.5rem 1.1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-weight:600">💾 Lưu & Deploy</button>
    </div>
  </div>
</div>`);
}

async function _saveStoryEdits(storyId) {
  const msg = document.getElementById('_se_msg');
  const _s  = (t,ok) => { msg.textContent=t; msg.style.display='block'; msg.style.cssText+=`;background:${ok?'#e8f5e9':'#fdecea'};color:${ok?'#27ae60':'#e74c3c'}`; };
  _s('⏳ Đang lấy dữ liệu từ GitHub...', true);
  try {
    const { stories, sha } = await AUTH.loadStories();
    const idx = stories.findIndex(s => s.id === storyId);
    if (idx < 0) { _s('Không tìm thấy truyện!', false); return; }
    const seEl     = document.getElementById('se_genre');
    const newGenre = seEl ? Array.from(seEl.querySelectorAll('input:checked')).map(c=>c.value) : [];
    const newTags  = (document.getElementById('se_tags')?.value||'').split(',').map(t=>t.trim()).filter(Boolean);
    stories[idx] = { ...stories[idx],
      title:       document.getElementById('se_t').value.trim(),
      author:      document.getElementById('se_a').value.trim(),
      cover:       document.getElementById('se_c').value.trim(),
      description: document.getElementById('se_d').value.trim(),
      status:      document.getElementById('se_st').value,
      source:      document.getElementById('se_src').value,
      genre:       newGenre.length ? newGenre : stories[idx].genre,
      genres:      newGenre.length ? newGenre : stories[idx].genres,
      tags:        newTags,
    };

    // ── Bulk chapter upload ───────────────────────────────────
    if (window._seNewChapters && window._seNewChapters.length > 0) {
      const mode = document.getElementById('_se_chap_mode')?.value || 'append';
      const existing = stories[idx].chapters || [];
      let maxId = existing.length ? Math.max(...existing.map(c => c.id || 0)) : 0;
      const chaptersToAdd = window._seNewChapters.map(c => {
        maxId++;
        return { id: maxId, title: c.title, content: c.content };
      });
      if (mode === 'replace') {
        stories[idx].chapters = chaptersToAdd;
      } else {
        stories[idx].chapters = [...existing, ...chaptersToAdd];
      }
    }

    _s('⏳ Đang lưu lên GitHub...', true);
    await AUTH.saveStories(stories, sha, `Online: sửa "${stories[idx].title}"`);
    _s('✅ Đã lưu! Web cập nhật trong ~1 phút.', true);
    setTimeout(() => { document.getElementById('_se_modal')?.remove(); location.reload(); }, 1400);
  } catch(e) { _s('❌ ' + e.message, false); }
}

// ── Story editor: bulk chapter upload helpers ──────────────────

/**
 * Parse one or more .txt / .docx files into chapter objects.
 * Single .txt with @@CHUONG markers → multiple chapters.
 * Multiple files → one chapter per file.
 */
async function _seParseChapFiles(input) {
  const stEl  = document.getElementById('_se_chap_st');
  const prvEl = document.getElementById('_se_chap_preview');
  stEl.textContent = '⏳ Đang phân tích file...';
  prvEl.style.display = 'none';
  window._seNewChapters = [];

  const files = Array.from(input.files || []);
  if (!files.length) { stEl.textContent = ''; return; }

  const chapters = [];

  for (const file of files) {
    const name = file.name;
    const ext  = name.split('.').pop().toLowerCase();

    try {
      if (ext === 'txt') {
        const raw = await file.text();
        const parsed = _seParseTextChapters(raw, name);
        chapters.push(...parsed);

      } else if (ext === 'docx' || ext === 'doc') {
        // Load mammoth.js on demand
        if (typeof mammoth === 'undefined') {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const arrayBuf = await file.arrayBuffer();
        const result   = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
        const parsed   = _seParseTextChapters(result.value, name.replace(/\.[^.]+$/, ''));
        chapters.push(...parsed);

      } else {
        stEl.textContent = `⚠️ Bỏ qua "${name}" — chỉ hỗ trợ .txt, .docx`;
        continue;
      }
    } catch(e) {
      stEl.textContent = `❌ Lỗi đọc "${name}": ${e.message}`;
      return;
    }
  }

  if (!chapters.length) {
    stEl.textContent = '⚠️ Không tìm thấy nội dung chương nào.';
    return;
  }

  window._seNewChapters = chapters;
  const mode = document.getElementById('_se_chap_mode')?.value || 'append';
  stEl.innerHTML = `✅ Tìm thấy <b>${chapters.length}</b> chương — nhấn <b>Lưu & Deploy</b> để ${mode === 'replace' ? 'thay thế toàn bộ' : 'thêm vào cuối'}.`;

  // Preview list
  prvEl.style.display = '';
  prvEl.innerHTML = chapters.map((c, i) =>
    `<div style="padding:.22rem 0;border-bottom:1px solid #eef3f7">
       <b style="color:#3ab3ca">${i+1}.</b> ${_esc(c.title)}
       <span style="color:#bbb;font-size:.68rem;margin-left:.4rem">(${c.content.length} ký tự)</span>
     </div>`
  ).join('');
}

/**
 * Parse plain text into chapter array.
 * If text contains @@CHUONG N markers → split into multiple chapters.
 * Otherwise the whole text is treated as one chapter (title = filename).
 */
function _seParseTextChapters(raw, fallbackName) {
  const text = raw.replace(/\r\n/g, '\n').trim();

  // Detect @@CHUONG N markers (case-insensitive, flexible spacing)
  const markerRe = /^@@CHUONG\s+(\d+)\s*(.*)?$/im;
  if (markerRe.test(text)) {
    const parts   = text.split(/^@@CHUONG\s+\d+/im);
    const headers = [...text.matchAll(/^@@CHUONG\s+(\d+)\s*(.*)?$/gim)];
    const chapters = [];
    // parts[0] is text before first marker — skip if empty
    for (let i = 0; i < headers.length; i++) {
      const rawTitle = (headers[i][2] || '').trim();
      const num      = headers[i][1];
      const title    = rawTitle || `Chương ${num}`;
      const content  = (parts[i + 1] || '').trim();
      if (content) chapters.push({ title, content });
    }
    return chapters;
  }

  // Single chapter: use first non-empty line as title candidate
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0]?.length <= 120 ? lines[0] : (fallbackName || 'Chương mới');
  const content = lines[0]?.length <= 120 ? lines.slice(1).join('\n') : text;
  return [{ title, content: content.trim() }];
}

/** Download a sample .txt template showing the @@CHUONG N format. */
function _seDownloadChapTemplate() {
  const sample =
`@@CHUONG 1 Tựa đề chương một (viết sau dấu cách)
Nội dung chương một viết ở đây.
Có thể xuống dòng nhiều lần.

Đây vẫn là nội dung chương 1.

@@CHUONG 2 Tựa đề chương hai
Nội dung chương hai bắt đầu sau dòng @@CHUONG 2.

@@CHUONG 3
Nếu không có tên thì hệ thống tự đặt "Chương 3".
`;
  const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'mau_nhap_chuong.txt';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// helper (avoid collision with global esc)
function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Chapter editor (from story.html chapter list) ──────────────
async function openChapterEditor(storyId, chapterId) {
  if (document.getElementById('_ce_modal')) return;
  const _tabActive   = 'padding:.38rem .9rem;border:none;border-bottom:2.5px solid #3ab3ca;background:transparent;cursor:pointer;font-size:.83rem;font-weight:700;color:#3ab3ca;font-family:inherit';
  const _tabInactive = 'padding:.38rem .9rem;border:none;border-bottom:2.5px solid transparent;background:transparent;cursor:pointer;font-size:.83rem;color:#9fb8cc;font-family:inherit;transition:color .15s';
  document.body.insertAdjacentHTML('beforeend', `
<div id="_ce_modal" onclick="if(event.target===this)this.remove()"
  style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:14px;padding:1.5rem;width:100%;max-width:800px;box-shadow:0 20px 60px rgba(0,0,0,.25)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem">
      <b style="font-size:1rem;color:#1a2535">✏️ Sửa chương</b>
      <button onclick="document.getElementById('_ce_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:.9rem">✕</button>
    </div>
    <div id="_ce_loading" style="text-align:center;padding:2rem;color:#9fb8cc">⏳ Đang tải nội dung...</div>
    <div id="_ce_form" style="display:none">
      ${_fld('Tên chương','ced_t','')}

      <!-- Affiliate URL -->
      <div style="margin-bottom:.85rem">
        <div style="font-size:.78rem;font-weight:600;color:#4a6080;margin-bottom:.28rem">
          🔗 Link tiếp thị liên kết
          <span style="font-weight:400;color:#9fb8cc;font-size:.72rem"> — hiển thị trong màn hình chờ giữa chương</span>
        </div>
        <input id="ced_aff" type="url" placeholder="https://shopee.vn/… hoặc để trống"
          style="width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box">
      </div>

      <!-- Chapter image -->
      <div style="margin-bottom:.85rem">
        <div style="font-size:.78rem;font-weight:600;color:#4a6080;margin-bottom:.28rem">
          🖼️ Ảnh minh họa chương
          <span style="font-weight:400;color:#9fb8cc;font-size:.72rem"> — không bắt buộc, hiển thị đầu chương</span>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          <input id="ced_img" type="url" placeholder="https://… hoặc để trống"
            style="flex:1;min-width:180px;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;box-sizing:border-box"
            oninput="_ceImgPreview()">
          <label style="cursor:pointer;padding:.38rem .75rem;background:#f0f4f8;border:1.5px solid #c5dce9;border-radius:7px;font-size:.77rem;font-weight:600;white-space:nowrap">
            📂 Upload
            <input type="file" accept="image/*" style="display:none" onchange="_ceImgUpload(this)">
          </label>
          <span id="_ced_img_st" style="font-size:.72rem;color:#9fb8cc"></span>
        </div>
        <div id="_ced_img_prev_wrap" style="display:none;margin-top:.35rem">
          <img id="_ced_img_thumb" src="" alt="" style="max-height:72px;border-radius:6px;border:1.5px solid #c5dce9">
        </div>
      </div>

      <!-- Tab bar -->
      <div style="border-bottom:2px solid #eef3f7;margin-bottom:.85rem;display:flex;gap:0">
        <button id="_ced_tb_edit" onclick="_ceTabs('edit')" style="${_tabActive}">✏️ Chỉnh sửa</button>
        <button id="_ced_tb_word" onclick="_ceTabs('word')" style="${_tabInactive}">📄 Upload Word</button>
        <button id="_ced_tb_prev" onclick="_ceTabs('prev')" style="${_tabInactive}">👁 Xem trước</button>
      </div>

      <!-- Pane: Edit -->
      <div id="_ced_pane_edit">
        <textarea id="ced_c" rows="20"
          style="width:100%;padding:.75rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.88rem;font-family:'Merriweather',Georgia,serif;line-height:1.85;resize:vertical;box-sizing:border-box;outline:none"></textarea>
        <div style="font-size:.72rem;color:#9fb8cc;margin-top:.2rem">Dùng <code style="background:#f0f4f8;padding:.1rem .3rem;border-radius:3px">*nghiêng*</code> · <code style="background:#f0f4f8;padding:.1rem .3rem;border-radius:3px">**đậm**</code></div>
      </div>

      <!-- Pane: Word upload -->
      <div id="_ced_pane_word" style="display:none">
        <div style="border:2px dashed #c5dce9;border-radius:10px;padding:1.5rem;text-align:center;background:#fafcff">
          <div style="font-size:2rem;margin-bottom:.4rem">📄</div>
          <div style="font-size:.84rem;color:#4a6080;margin-bottom:.75rem">Chọn file <b>.docx</b> hoặc <b>.txt</b> để thay thế toàn bộ nội dung chương này</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:.65rem;flex-wrap:wrap">
            <label style="cursor:pointer;padding:.45rem 1.3rem;background:#3ab3ca;color:#fff;border-radius:8px;font-size:.84rem;font-weight:600;display:inline-block">
              📂 Chọn file
              <input type="file" accept=".docx,.doc,.txt" style="display:none" id="_ced_word_inp" onchange="_ceLoadWord(this)">
            </label>
            <button type="button" onclick="_ceDownloadTemplate()"
              style="padding:.45rem 1rem;background:#fff;border:1.5px solid #c5dce9;border-radius:8px;font-size:.82rem;font-weight:600;color:#4a6080;cursor:pointer;font-family:inherit">
              📥 Tải file mẫu
            </button>
          </div>
          <div id="_ced_word_st" style="font-size:.76rem;color:#9fb8cc;margin-top:.55rem"></div>
        </div>
        <div id="_ced_word_prev_wrap" style="display:none;margin-top:.85rem">
          <div style="font-size:.79rem;font-weight:600;color:#4a6080;margin-bottom:.35rem">📋 Nội dung trích xuất — xem trước trước khi áp dụng:</div>
          <div id="_ced_word_prev" style="max-height:280px;overflow-y:auto;padding:.75rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.83rem;font-family:'Merriweather',Georgia,serif;line-height:1.75;background:#fafcff;white-space:pre-wrap"></div>
          <div style="margin-top:.6rem;display:flex;gap:.5rem;flex-wrap:wrap">
            <button onclick="_ceApplyWord()"
              style="padding:.44rem 1.1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:.83rem;font-weight:600;font-family:inherit">
              ✅ Áp dụng thay thế nội dung cũ
            </button>
            <button onclick="_ceWordCancel()"
              style="padding:.44rem .9rem;background:#fff;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;font-size:.83rem;font-family:inherit">
              Hủy
            </button>
          </div>
        </div>
      </div>

      <!-- Pane: Preview -->
      <div id="_ced_pane_prev" style="display:none">
        <div id="_ced_prev_body" style="min-height:200px;padding:1.1rem 1.3rem;border:1.5px solid #c5dce9;border-radius:8px;background:#fafcff;font-family:'Merriweather',Georgia,serif;font-size:.9rem;line-height:1.9;max-height:520px;overflow-y:auto"></div>
      </div>

      <div id="_ce_msg" style="display:none;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-top:.75rem"></div>
      <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.9rem;padding-top:.75rem;border-top:1.5px solid #eef3f7">
        <button onclick="document.getElementById('_ce_modal').remove()"
          style="padding:.5rem 1rem;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;background:#fff;font-family:inherit">Hủy</button>
        <button onclick="_saveCh('${storyId}',${chapterId})"
          style="padding:.5rem 1.2rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-weight:600">💾 Lưu & Deploy</button>
      </div>
    </div>
  </div>
</div>`);

  // ── Tab switching ──
  const _tabA = 'padding:.38rem .9rem;border:none;border-bottom:2.5px solid #3ab3ca;background:transparent;cursor:pointer;font-size:.83rem;font-weight:700;color:#3ab3ca;font-family:inherit';
  const _tabI = 'padding:.38rem .9rem;border:none;border-bottom:2.5px solid transparent;background:transparent;cursor:pointer;font-size:.83rem;color:#9fb8cc;font-family:inherit';
  window._ceTabs = function(tab) {
    ['edit','word','prev'].forEach(t => {
      const pane = document.getElementById('_ced_pane_' + t);
      const btn  = document.getElementById('_ced_tb_' + t);
      if (pane) pane.style.display = t === tab ? '' : 'none';
      if (btn)  btn.style.cssText  = t === tab ? _tabA : _tabI;
    });
    if (tab === 'prev') {
      const raw  = document.getElementById('ced_c')?.value || '';
      const body = document.getElementById('_ced_prev_body');
      const imgUrl = (document.getElementById('ced_img')?.value || '').trim();
      if (body) {
        const imgHtml = imgUrl ? `<img src="${imgUrl.replace(/"/g,'&quot;')}" alt="" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-bottom:1rem" onerror="this.style.display='none'">` : '';
        body.innerHTML = imgHtml + raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .split(/\n\n+/)
          .map(p => `<p style="margin:0 0 1em">${p
            .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
            .replace(/\*(.*?)\*/g,'<i>$1</i>')
            .replace(/\n/g,'<br>')
          }</p>`).join('');
      }
    }
  };

  // ── Image preview & upload ──
  window._ceImgPreview = function() {
    const url  = (document.getElementById('ced_img')?.value || '').trim();
    const wrap = document.getElementById('_ced_img_prev_wrap');
    const thumb = document.getElementById('_ced_img_thumb');
    if (!wrap || !thumb) return;
    if (url) { thumb.src = url; wrap.style.display = ''; }
    else      wrap.style.display = 'none';
  };
  window._ceImgUpload = async function(input) {
    const file = input.files?.[0];
    const st   = document.getElementById('_ced_img_st');
    if (!file) return;
    if (st) st.textContent = '⏳ Đang nén và upload…';
    try {
      const b64  = await _resizeImageToJpegBase64(file);
      const fname = 'images/chapters/' + Date.now() + '.jpg';
      await AUTH.ghPutRaw(fname, b64, 'Upload: chapter image ' + file.name);
      const url = 'https://raw.githubusercontent.com/' + GH_REPO + '/main/' + fname;
      const inp = document.getElementById('ced_img');
      if (inp) { inp.value = url; _ceImgPreview(); }
      if (st) st.textContent = '✅ Upload xong!';
    } catch(err) { if (st) st.textContent = '❌ ' + err.message; }
  };

  // ── Word upload ──
  window._ceWordText = '';
  window._ceLoadWord = async function(input) {
    const file = input.files?.[0];
    const st   = document.getElementById('_ced_word_st');
    if (!file) return;
    if (st) st.textContent = '⏳ Đang đọc file…';

    try {
      // ── .txt: read directly ──────────────────────────────
      if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        window._ceWordText = await file.text();
      } else {
        // ── .docx: load mammoth.js dynamically ──────────────
        if (typeof mammoth === 'undefined') {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
            s.onload = res; s.onerror = () => rej(new Error('Không tải được mammoth.js'));
            document.head.appendChild(s);
          });
        }
        const buf    = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        window._ceWordText = result.value;
      }

      const prev = document.getElementById('_ced_word_prev');
      const wrap = document.getElementById('_ced_word_prev_wrap');
      if (prev) prev.textContent = window._ceWordText.slice(0, 4000) + (window._ceWordText.length > 4000 ? '\n…(còn nhiều hơn)' : '');
      if (wrap) wrap.style.display = '';
      if (st)   st.textContent = `✅ Đọc xong · ${window._ceWordText.length.toLocaleString()} ký tự`;
    } catch(e) {
      if (st) st.textContent = '❌ Lỗi: ' + e.message;
    }
  };

  window._ceDownloadTemplate = function() {
    const chTitle = document.getElementById('ced_t')?.value?.trim() || 'Chương 1: Tên Chương';
    const content = [
      chTitle,
      '',
      '─────────────────────────────────────────',
      '💡 HƯỚNG DẪN:',
      '  • Xoá dòng hướng dẫn này trước khi upload',
      '  • Dùng *chữ nghiêng* và **chữ đậm** để định dạng',
      '  • Mỗi đoạn văn cách nhau bằng 1 dòng trống',
      '─────────────────────────────────────────',
      '',
      '[Bắt đầu nội dung chương ở đây...]',
      '',
      'Đoạn đầu tiên của chương. Viết nội dung truyện ở đây.',
      '',
      'Đoạn thứ hai. Mỗi đoạn cách nhau một dòng trống.',
      '',
      '─ *Hắn nhìn lên bầu trời, lòng tràn đầy quyết tâm.*',
      '',
      '**Một đoạn chữ đậm quan trọng.**',
      '',
      '[...tiếp tục nội dung...]',
    ].join('\n');

    const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = (chTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'chuong') + '.txt';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  window._ceApplyWord = function() {
    const ta = document.getElementById('ced_c');
    if (!ta || !window._ceWordText) return;
    if (!confirm('⚠️ Áp dụng sẽ THAY THẾ toàn bộ nội dung hiện tại bằng nội dung từ file Word.\nBạn có chắc chắn?')) return;
    ta.value = window._ceWordText;
    window._ceTabs('edit');
    const st = document.getElementById('_ced_word_st');
    if (st) st.textContent = '✅ Đã áp dụng — kiểm tra ở tab Chỉnh sửa.';
    const wrap = document.getElementById('_ced_word_prev_wrap');
    if (wrap) wrap.style.display = 'none';
  };
  window._ceWordCancel = function() {
    const inp  = document.getElementById('_ced_word_inp');
    const wrap = document.getElementById('_ced_word_prev_wrap');
    const st   = document.getElementById('_ced_word_st');
    if (inp)  inp.value = '';
    if (wrap) wrap.style.display = 'none';
    if (st)   st.textContent = '';
    window._ceWordText = '';
  };

  // ── Load chapter data ──
  try {
    const { stories } = await AUTH.loadStories();
    const ch = stories.find(s => s.id === storyId)?.chapters.find(c => c.id === chapterId);
    if (!ch) throw new Error('Không tìm thấy chương!');
    document.getElementById('ced_t').value   = ch.title;
    document.getElementById('ced_aff').value = ch.affiliateUrl || '';
    document.getElementById('ced_img').value = ch.chapImage    || '';
    document.getElementById('ced_c').value   = ch.content;
    if (ch.chapImage) window._ceImgPreview();
    document.getElementById('_ce_loading').style.display = 'none';
    document.getElementById('_ce_form').style.display    = 'block';
  } catch(e) {
    document.getElementById('_ce_loading').textContent = '❌ ' + e.message;
  }
}

async function _saveCh(storyId, chapterId) {
  const msg = document.getElementById('_ce_msg');
  const _s  = (t,ok) => { msg.textContent=t; msg.style.display='block'; msg.style.cssText+=`;background:${ok?'#e8f5e9':'#fdecea'};color:${ok?'#27ae60':'#e74c3c'}`; };
  _s('⏳ Đang lấy dữ liệu...', true);
  try {
    const { stories, sha } = await AUTH.loadStories();
    const story = stories.find(s=>s.id===storyId);
    const ch    = story?.chapters.find(c=>c.id===chapterId);
    if (!ch) { _s('Không tìm thấy chương!', false); return; }
    ch.title   = document.getElementById('ced_t').value.trim();
    ch.content = document.getElementById('ced_c').value;
    const aff  = (document.getElementById('ced_aff')?.value || '').trim();
    if (aff) ch.affiliateUrl = aff; else delete ch.affiliateUrl;
    const img  = (document.getElementById('ced_img')?.value  || '').trim();
    if (img) ch.chapImage = img; else delete ch.chapImage;
    _s('⏳ Đang lưu lên GitHub...', true);
    await AUTH.saveStories(stories, sha, `Online: sửa ${ch.title}`);
    _s('✅ Đã lưu! Web cập nhật trong ~1 phút.', true);
    setTimeout(() => { document.getElementById('_ce_modal')?.remove(); location.reload(); }, 1400);
  } catch(e) { _s('❌ ' + e.message, false); }
}

// ── Chapter editor (inline on reader.html) ─────────────────────
function openChapterEditorInline(storyId, chapterId) {
  const body = document.getElementById('chapter-body');
  if (!body || document.getElementById('_cie')) return;
  // Use raw content from context to preserve markdown (*italic*, **bold**)
  const origText = window._currentReaderCtx?.chapter?.content ?? body.innerText;
  body.style.display = 'none';
  body.insertAdjacentHTML('afterend', `
    <div id="_cie" style="font-family:'Inter',sans-serif">
      <div style="font-size:.78rem;color:#3ab3ca;font-weight:500;margin-bottom:.4rem">✏️ Chỉnh sửa nội dung chương</div>
      <textarea id="_cie_ta"
        style="width:100%;min-height:55vh;padding:1rem 1.2rem;border:2px solid #3ab3ca;border-radius:10px;font-size:var(--reader-fs,17px);font-family:var(--reader-font,'Merriweather',Georgia,serif);line-height:var(--reader-lh,1.8);resize:vertical;box-sizing:border-box;outline:none"
        >${_ea(origText)}</textarea>
      <div id="_cie_msg" style="display:none;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin:.5rem 0"></div>
      <div style="display:flex;gap:.6rem;margin-top:.7rem">
        <button onclick="_saveInlineCh('${storyId}',${chapterId})"
          style="padding:.5rem 1.2rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-weight:600">💾 Lưu & Deploy</button>
        <button onclick="document.getElementById('_cie').remove();document.getElementById('chapter-body').style.display=''"
          style="padding:.5rem 1rem;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;background:#fff;font-family:inherit">Hủy</button>
      </div>
    </div>`);
}

async function _saveInlineCh(storyId, chapterId) {
  const msg = document.getElementById('_cie_msg');
  const _s  = (t,ok) => { msg.textContent=t; msg.style.display='block'; msg.style.cssText+=`;background:${ok?'#e8f5e9':'#fdecea'};color:${ok?'#27ae60':'#e74c3c'}`; };
  _s('⏳ Đang lấy dữ liệu...', true);
  try {
    const { stories, sha } = await AUTH.loadStories();
    const ch = stories.find(s=>s.id===storyId)?.chapters.find(c=>c.id===chapterId);
    if (!ch) { _s('Không tìm thấy chương!', false); return; }
    ch.content = document.getElementById('_cie_ta').value;
    _s('⏳ Đang lưu lên GitHub...', true);
    await AUTH.saveStories(stories, sha, `Online: sửa ${ch.title}`);
    _s('✅ Đã lưu! Web cập nhật trong ~1 phút.', true);
    setTimeout(() => location.reload(), 1200);
  } catch(e) { _s('❌ ' + e.message, false); }
}

// ── Add chapter modal ──────────────────────────────────────────
function openAddChapter(storyId) {
  if (document.getElementById('_ac_modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
<div id="_ac_modal" onclick="if(event.target===this)this.remove()"
  style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:14px;padding:1.5rem;width:100%;max-width:720px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>➕ Thêm chương mới</b>
      <button onclick="document.getElementById('_ac_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button>
    </div>
    ${_fld('Tên chương','ac_t','Chương X: Tên chương')}
    <div style="margin-bottom:.85rem">
      <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">Nội dung</div>
      <textarea id="ac_c" rows="18" placeholder="Nhập nội dung chương..."
        style="width:100%;padding:.75rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.88rem;font-family:'Merriweather',Georgia,serif;line-height:1.8;resize:vertical;box-sizing:border-box;outline:none"></textarea>
    </div>
    <div id="_ac_msg" style="display:none;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-bottom:.7rem"></div>
    <div style="display:flex;gap:.5rem;justify-content:flex-end">
      <button onclick="document.getElementById('_ac_modal').remove()"
        style="padding:.5rem 1rem;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;background:#fff;font-family:inherit">Hủy</button>
      <button onclick="_doAddChapter('${storyId}')"
        style="padding:.5rem 1.1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-weight:600">💾 Lưu & Deploy</button>
    </div>
  </div>
</div>`);
}

async function _doAddChapter(storyId) {
  const msg = document.getElementById('_ac_msg');
  const _s  = (t,ok) => { msg.textContent=t; msg.style.display='block'; msg.style.cssText+=`;background:${ok?'#e8f5e9':'#fdecea'};color:${ok?'#27ae60':'#e74c3c'}`; };
  const title   = document.getElementById('ac_t').value.trim();
  const content = document.getElementById('ac_c').value.trim();
  if (!title || !content) { _s('Vui lòng nhập đủ tiêu đề và nội dung!', false); return; }
  _s('⏳ Đang tải dữ liệu...', true);
  try {
    const { stories, sha } = await AUTH.loadStories();
    const story = stories.find(s=>s.id===storyId);
    if (!story) { _s('Không tìm thấy truyện!', false); return; }
    const maxId = Math.max(0, ...story.chapters.map(c=>c.id));
    story.chapters.push({ id: maxId + 1, title, content });
    _s('⏳ Đang lưu lên GitHub...', true);
    await AUTH.saveStories(stories, sha, `Online: thêm ${title} (${story.title})`);
    _s('✅ Đã thêm chương! Web cập nhật trong ~1 phút.', true);
    setTimeout(() => { document.getElementById('_ac_modal')?.remove(); location.reload(); }, 1400);
  } catch(e) { _s('❌ ' + e.message, false); }
}

// ── Delete story ───────────────────────────────────────────────
async function deleteStoryOnline(storyId) {
  if (!confirm('⚠️ Xóa toàn bộ truyện này?\nHành động không thể hoàn tác!')) return;
  try {
    const { stories, sha } = await AUTH.loadStories();
    const filtered = stories.filter(s=>s.id!==storyId);
    await AUTH.saveStories(filtered, sha, `Online: xóa truyện ${storyId}`);
    alert('✅ Đã xóa! Chuyển về trang chủ...');
    location.href = location.pathname.includes('/luulyhiennhicac/') ? '/luulyhiennhicac/' : '/';
  } catch(e) { alert('❌ ' + e.message); }
}

// ── AI Content Moderation ─────────────────────────────────────
function _openAiModeration() {
  if (document.getElementById('_ai_modal')) return;
  const savedKey = localStorage.getItem('_llhnc_gk') || '';
  document.body.insertAdjacentHTML('beforeend', `
<div id="_ai_modal" onclick="if(event.target===this)this.remove()"
  style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:14px;padding:1.5rem;width:100%;max-width:780px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
      <div>
        <b style="font-size:1rem;color:#1a2535">🤖 AI Kiểm duyệt Nội dung &amp; Bản quyền</b>
        <div style="font-size:.72rem;color:#9fb8cc;margin-top:.1rem">Phân tích 2 nhóm: Nội dung vi phạm · Bản quyền &amp; Đạo văn</div>
      </div>
      <button onclick="document.getElementById('_ai_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap">
      <input id="_ai_key" type="password" placeholder="Gemini API Key — bắt đầu bằng AIza… (lấy miễn phí tại aistudio.google.com)"
        value="${_ea(savedKey)}"
        style="flex:1;min-width:200px;padding:.45rem .7rem;border:1.5px solid #c5dce9;border-radius:7px;font-size:.84rem;font-family:inherit;outline:none">
      <button onclick="_testAiKey()"
        style="padding:.45rem .9rem;background:#f0f4f8;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;font-size:.83rem;font-family:inherit">🔍 Test</button>
      <button onclick="_saveAiKey()"
        style="padding:.45rem .9rem;background:#f0f4f8;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;font-size:.83rem;font-family:inherit">💾 Lưu key</button>
      <button onclick="_runAiCheckAll()"
        style="padding:.45rem 1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:.85rem;font-weight:600;font-family:inherit">▶ Kiểm tra tất cả</button>
    </div>
    <div style="font-size:.75rem;color:#9fb8cc;margin-bottom:.7rem">
      📌 Lấy API Key miễn phí: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3ab3ca">aistudio.google.com/app/apikey</a>
      &nbsp;·&nbsp; Key hợp lệ bắt đầu bằng <code style="background:#f0f4f8;padding:.05rem .3rem;border-radius:3px">AIza</code>
    </div>
    <div id="_ai_status" style="font-size:.8rem;color:#9fb8cc;margin-bottom:.8rem">Nhập Gemini API Key rồi bấm "Test" để xác nhận hoặc "Kiểm tra tất cả".</div>
    <div id="_ai_results"></div>
  </div>
</div>`);
}

function _saveAiKey() {
  const key = (document.getElementById('_ai_key')?.value || '').trim();
  const st  = document.getElementById('_ai_status');
  if (!key) { if (st) st.textContent = '⚠️ Key trống — không lưu.'; return; }
  if (!key.startsWith('AIza')) { if (st) st.innerHTML = '❌ Key không đúng định dạng. Gemini API key phải bắt đầu bằng <b>AIza</b>. Lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3ab3ca">aistudio.google.com</a>.'; return; }
  localStorage.setItem('_llhnc_gk', key);
  if (st) st.textContent = '✅ Đã lưu API Key.';
}

async function _testAiKey() {
  const keyEl  = document.getElementById('_ai_key');
  const apiKey = (keyEl?.value || '').trim() || localStorage.getItem('_llhnc_gk') || '';
  const st     = document.getElementById('_ai_status');
  if (!apiKey) { if (st) st.textContent = '❌ Vui lòng nhập API Key.'; return; }
  if (!apiKey.startsWith('AIza')) {
    if (st) st.innerHTML = '❌ Key không đúng định dạng. Gemini API key phải bắt đầu bằng <b>AIza</b>.';
    return;
  }
  // Clear cache so we re-probe all models with this key
  localStorage.removeItem('_llhnc_gm');
  localStorage.removeItem('_llhnc_gk2');
  if (st) st.textContent = '⏳ Đang kiểm tra key và liệt kê models…';
  try {
    // Show all available models
    let modelList = [];
    try { modelList = await _listGeminiModels(apiKey); } catch(_){}
    const model = await _getWorkingGeminiModel(apiKey);
    localStorage.setItem('_llhnc_gk', apiKey);
    const listStr = modelList.slice(0,5).join(', ') + (modelList.length>5 ? ` (+${modelList.length-5} khác)`:'');
    if (st) st.innerHTML = `✅ Key hợp lệ! Đang dùng: <b>${_ea(model)}</b>`
      + (listStr ? `<br><span style="font-size:.74rem;color:#7fb0ca">Models có sẵn: ${_ea(listStr)}</span>` : '');
  } catch(e) {
    if (st) st.innerHTML = `❌ ${_ea(e.message)} &nbsp;·&nbsp; <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3ab3ca">Lấy key mới tại đây</a>`;
  }
}

async function _runAiCheckAll() {
  const keyEl  = document.getElementById('_ai_key');
  const apiKey = (keyEl?.value || '').trim() || localStorage.getItem('_llhnc_gk') || '';
  const st     = document.getElementById('_ai_status');
  const results = document.getElementById('_ai_results');
  if (!apiKey) { if (st) st.textContent = '❌ Vui lòng nhập Gemini API Key.'; return; }
  if (!apiKey.startsWith('AIza')) {
    if (st) st.innerHTML = '❌ Key không đúng định dạng. Key phải bắt đầu bằng <b>AIza</b> — lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3ab3ca">aistudio.google.com</a>.';
    return;
  }
  localStorage.setItem('_llhnc_gk', apiKey);
  if (!st || !results) return;

  st.textContent = '⏳ Đang tải danh sách truyện từ GitHub...';
  results.innerHTML = '';

  let stories, sha;
  try { ({ stories, sha } = await AUTH.loadStories()); }
  catch(e) { st.textContent = '❌ Không tải được dữ liệu: ' + e.message; return; }

  st.textContent = `Đang kiểm tra ${stories.length} truyện...`;

  for (let i = 0; i < stories.length; i++) {
    const s = stories[i];
    const rid = '_air_' + s.id.replace(/[^a-z0-9]/gi,'_');
    results.insertAdjacentHTML('beforeend', `
      <div id="${rid}" style="background:#f8fafc;border:1.5px solid #dce8f5;border-radius:9px;padding:.75rem 1rem;margin-bottom:.6rem">
        <div style="display:flex;align-items:center;gap:.55rem;flex-wrap:wrap">
          <div style="flex:1;min-width:160px">
            <b style="font-size:.87rem;color:#1a2535">${_ea(s.title)}</b>
            <span style="font-size:.74rem;color:#9fb8cc;margin-left:.35rem">${_ea(s.author)}</span>
            ${s.hidden?'<span style="font-size:.7rem;background:#fdecea;color:#e74c3c;border-radius:4px;padding:.1rem .35rem;margin-left:.3rem">Đã ẩn</span>':''}
          </div>
          <span id="${rid}_badge" style="font-size:.78rem;color:#9fb8cc">⏳ Đang phân tích...</span>
          <div id="${rid}_act" style="display:flex;gap:.4rem"></div>
        </div>
        <div id="${rid}_detail"></div>
      </div>`);

    st.textContent = `Kiểm tra (${i+1}/${stories.length}): ${s.title}`;
    try {
      const r      = await _aiCheckStory(s, apiKey);
      const badge  = document.getElementById(rid+'_badge');
      const act    = document.getElementById(rid+'_act');
      const detail = document.getElementById(rid+'_detail');
      if (!badge) continue;

      // ── Scores ──
      const cScore  = r.content?.score  ?? 0;
      const cpScore = r.copyright?.score ?? 0;
      const overallSafe = r.overall?.safe ?? (cScore <= 3 && cpScore <= 3);

      // ── Copyright type label ──
      const cpTypeMap = {
        original:         '🖊 Sáng tác gốc',
        translation_ok:   '📖 Bản dịch (có nguồn)',
        translation_risk: '⚠️ Bản dịch (nghi dịch lậu)',
        fanfiction:       '✍️ Fan fiction',
        suspected_copy:   '🚨 Nghi đạo văn',
        unknown:          '❓ Không rõ',
      };
      const cpTypeLabel = cpTypeMap[r.copyright?.type] || r.copyright?.type || '❓';

      // ── Score color ──
      const _sc = n => n <= 3 ? '#27ae60' : n <= 6 ? '#e67e22' : '#e74c3c';
      const _dot = (label, score) =>
        `<span style="display:inline-flex;align-items:center;gap:.25rem;font-size:.74rem;padding:.15rem .5rem;border-radius:12px;background:${score<=3?'#e8f5e9':score<=6?'#fff3cd':'#fdecea'};color:${_sc(score)};border:1px solid ${score<=3?'#a8d5b5':score<=6?'#ffc107':'#f0b8bc'}">
          ${score<=3?'✅':score<=6?'⚠️':'🚨'} ${label} ${score}/10
        </span>`;

      // ── Summary badge ──
      badge.innerHTML = overallSafe
        ? `<span style="color:#27ae60;font-weight:600">✅ Đạt yêu cầu</span>`
        : `<span style="color:#e74c3c;font-weight:600">🚨 Cần xem xét</span>`;

      // ── Detail row ──
      if (detail) {
        const contentIssues   = r.content?.issues  || [];
        const copyrightIssues = r.copyright?.issues || [];
        const needsAttr       = r.copyright?.needsAttribution;

        let html = `<div style="margin-top:.55rem;display:flex;flex-wrap:wrap;gap:.35rem;align-items:center">
          ${_dot('Nội dung', cScore)}
          ${_dot('Bản quyền', cpScore)}
          <span style="font-size:.72rem;color:#7a9ab8;background:#f0f4f8;padding:.15rem .5rem;border-radius:12px;border:1px solid #dde8f5">${cpTypeLabel}</span>
          ${needsAttr ? '<span style="font-size:.72rem;color:#e67e22;background:#fff3cd;padding:.15rem .5rem;border-radius:12px;border:1px solid #ffc107">📌 Cần ghi nguồn</span>' : ''}
        </div>`;

        // Content issues
        if (contentIssues.length) {
          html += `<div style="margin-top:.4rem;background:#fdecea;border-radius:6px;padding:.35rem .6rem;font-size:.75rem;color:#c0392b">
            <b>Nội dung:</b><br>${contentIssues.map(x=>'• '+_ea(x)).join('<br>')}
          </div>`;
        }
        // Copyright issues
        if (copyrightIssues.length) {
          html += `<div style="margin-top:.3rem;background:#fff3cd;border-radius:6px;padding:.35rem .6rem;font-size:.75rem;color:#7d5a00">
            <b>Bản quyền:</b><br>${copyrightIssues.map(x=>'• '+_ea(x)).join('<br>')}
          </div>`;
        }
        // Recommendation
        if (r.overall?.recommendation && r.overall.recommendation !== 'an toàn') {
          html += `<div style="margin-top:.3rem;font-size:.74rem;color:#555;font-style:italic">💬 ${_ea(r.overall.recommendation)}</div>`;
        }
        detail.innerHTML = html;
      }

      // ── Action buttons ──
      if (act) {
        const btnHide = `<button onclick="_toggleHideStory('${s.id}',true,'${_ea(s.title)}')"
          style="padding:.22rem .6rem;background:#fdecea;color:#e74c3c;border:1.5px solid #f0b8bc;border-radius:6px;cursor:pointer;font-size:.77rem;font-family:inherit">🙈 Ẩn</button>`;
        const btnShow = `<button onclick="_toggleHideStory('${s.id}',false,'${_ea(s.title)}')"
          style="padding:.22rem .6rem;background:#e8f5e9;color:#27ae60;border:1.5px solid #a8d5b5;border-radius:6px;cursor:pointer;font-size:.77rem;font-family:inherit">👁 Hiện</button>`;
        if (s.hidden) {
          act.innerHTML = btnShow;
        } else if (!overallSafe || cpScore > 3) {
          act.innerHTML = btnHide;
        }
      }
    } catch(e) {
      const badge = document.getElementById(rid+'_badge');
      if (badge) badge.innerHTML=`<span style="color:#e74c3c">❌ ${_ea(e.message)}</span>`;
    }
    await new Promise(r => setTimeout(r, 600)); // rate limit buffer
  }
  st.textContent = `✅ Đã kiểm tra xong ${stories.length} truyện.`;
}

// Fallback model list (used only if API listing fails)
const _GEMINI_MODELS_FB = [
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

async function _geminiRequest(apiKey, model, prompt) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.1,maxOutputTokens:64} }) }
  );
  if (!resp.ok) {
    const e = await resp.json().catch(()=>({}));
    throw new Error(e.error?.message || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// Fetch all models available to this API key via the list endpoint
async function _listGeminiModels(apiKey) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`,
    { headers:{'Content-Type':'application/json'} }
  );
  if (!resp.ok) {
    const e = await resp.json().catch(()=>({}));
    throw new Error(e.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  // Filter to models that support generateContent, prefer flash/lite
  const models = (data.models || [])
    .filter(m => (m.supportedGenerationMethods||[]).includes('generateContent'))
    .map(m => m.name.replace('models/', ''))
    .sort((a,b) => {
      // Prefer flash over pro, smaller over larger for cost
      const score = s => s.includes('flash')?0:s.includes('lite')?1:2;
      return score(a) - score(b);
    });
  return models;
}

async function _getWorkingGeminiModel(apiKey) {
  const keyFp = apiKey.slice(-8);
  // Return cached if same key
  if (localStorage.getItem('_llhnc_gk2') === keyFp) {
    const cached = localStorage.getItem('_llhnc_gm');
    if (cached) return cached;
  }

  const _isKeyError = msg =>
    msg.includes('API key not valid') || msg.includes('API_KEY_INVALID') ||
    (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('key'));

  // Step 1: try to list available models from the API itself
  let modelList = [];
  try {
    modelList = await _listGeminiModels(apiKey);
  } catch(e) {
    if (_isKeyError(e.message||''))
      throw new Error('API key không hợp lệ. Vui lòng lấy key mới tại aistudio.google.com/app/apikey');
    // Network error or other — fall back to hardcoded list
    modelList = _GEMINI_MODELS_FB;
  }

  if (!modelList.length) modelList = _GEMINI_MODELS_FB;

  // Step 2: use first model from the list (already sorted, no need to probe)
  const model = modelList[0];
  localStorage.setItem('_llhnc_gm',  model);
  localStorage.setItem('_llhnc_gk2', keyFp);
  return model;
}

async function _aiCheckStory(story, apiKey) {
  const model  = await _getWorkingGeminiModel(apiKey);
  const sample = story.chapters.slice(0,3).map(c=>(c.content||'').slice(0,800)).join('\n---\n');
  const src    = story.source || 'không rõ';

  const prompt = `Bạn là chuyên gia kiểm duyệt nội dung VÀ bản quyền cho nền tảng đọc truyện Việt Nam hợp pháp. Hãy phân tích tác phẩm sau một cách nghiêm túc và khách quan:

THÔNG TIN TÁC PHẨM:
- Tên: ${story.title}
- Tác giả khai báo: ${story.author}
- Nguồn: ${src}
- Mô tả: ${story.description}
- Nội dung mẫu (${story.chapters?.length||0} chương, trích 3 chương đầu):
${sample}

━━━ NHÓM 1: KIỂM DUYỆT NỘI DUNG ━━━
Đánh giá từng tiêu chí (điểm rủi ro 0–10):
1. Chính trị / Kích động: tuyên truyền chống nhà nước, kích động bạo loạn, chia rẽ dân tộc
2. Bạo lực cực đoan: mô tả tra tấn/giết chóc chi tiết, bạo lực không có giá trị nghệ thuật
3. Nội dung 18+ / Khiêu dâm: tình dục, khiêu dâm, kể cả ngầm ý rõ ràng
4. Thông tin nguy hại: hướng dẫn chế vũ khí, chất độc, tự làm hại bản thân
5. Phân biệt đối xử: kỳ thị sắc tộc, giới tính, tôn giáo, người khuyết tật

━━━ NHÓM 2: BẢN QUYỀN ━━━
Đánh giá từng tiêu chí (điểm rủi ro 0–10):
1. Đạo văn / Sao chép: nội dung trùng khớp hoặc phỏng theo sát tác phẩm đã xuất bản
2. Dịch lậu (Piracy): dịch light novel/web novel/manhwa/manhua nước ngoài không có giấy phép bản dịch hợp pháp tại Việt Nam
3. Vi phạm nhân vật có bản quyền: dùng nhân vật/thế giới độc quyền (ví dụ Harry Potter, One Piece...) mà không ghi rõ "fan fiction"
4. Thiếu ghi nhận nguồn: tác phẩm dịch/sưu tầm không ghi tên tác giả gốc, tên bộ gốc, ngôn ngữ gốc
5. Mạo nhận bản quyền: khai "Sáng tác" nhưng dấu hiệu cho thấy là bản dịch/sao chép

Phân loại tác phẩm:
- "original"         → Sáng tác gốc, không dấu hiệu sao chép
- "translation_ok"   → Bản dịch hợp lệ, có ghi nhận tác giả gốc
- "translation_risk" → Bản dịch nhưng thiếu thông tin nguồn / nghi dịch lậu
- "fanfiction"       → Fan fiction dựa trên tác phẩm khác, ghi rõ
- "suspected_copy"   → Nghi đạo văn hoặc sao chép không ghi nguồn
- "unknown"          → Không đủ thông tin để xác định

Chỉ trả về JSON hợp lệ (không markdown, không giải thích):
{
  "content": {
    "safe": true,
    "score": 0,
    "issues": [],
    "flags": { "politics":0, "violence":0, "adult":0, "harmful":0, "discrimination":0 }
  },
  "copyright": {
    "safe": true,
    "score": 0,
    "type": "original",
    "issues": [],
    "needsAttribution": false,
    "flags": { "plagiarism":0, "piracy":0, "charRights":0, "missingSource":0, "falseClaim":0 }
  },
  "overall": {
    "safe": true,
    "recommendation": "an toàn"
  }
}`;

  const data = await _geminiRequest(apiKey, model, prompt);
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  // Extract first complete JSON object
  const m = text.match(/\{[\s\S]*\}/);
  try {
    return m ? JSON.parse(m[0]) : _defaultAiResult();
  } catch {
    return _defaultAiResult();
  }
}

function _defaultAiResult() {
  return {
    content:   { safe:true,  score:0, issues:[], flags:{} },
    copyright: { safe:true,  score:0, type:'unknown', issues:[], needsAttribution:false, flags:{} },
    overall:   { safe:true,  recommendation:'an toàn' }
  };
}

async function _toggleHideStory(storyId, hide, title) {
  if (!confirm(hide ? `Ẩn truyện "${title}" khỏi website?\n(Dữ liệu không bị xóa, có thể hiện lại)` : `Hiện lại truyện "${title}"?`)) return;
  try {
    const { stories, sha } = await AUTH.loadStories();
    const idx = stories.findIndex(s => s.id === storyId);
    if (idx < 0) { alert('Không tìm thấy truyện!'); return; }
    stories[idx].hidden = hide;
    await AUTH.saveStories(stories, sha, `${hide?'Ẩn':'Hiện'} truyện: ${stories[idx].title}`);
    alert(`✅ Đã ${hide?'ẩn':'hiện'} truyện. Web cập nhật sau ~1 phút.`);
    document.getElementById('_ai_modal')?.remove();
  } catch(e) { alert('❌ ' + e.message); }
}

// ── Helpers ────────────────────────────────────────────────────
function _fld(lbl, id, val, type='input') {
  const st = 'width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box';
  return `<div style="margin-bottom:.85rem">
    <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">${lbl}</div>
    ${type==='textarea'
      ? `<textarea id="${id}" rows="3" style="${st};resize:vertical">${_ea(val)}</textarea>`
      : `<input id="${id}" type="text" value="${_ea(val)}" style="${st}">`}
  </div>`;
}
function _sel(lbl, id, opts, cur) {
  return `<div>
    <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">${lbl}</div>
    <select id="${id}" style="width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;cursor:pointer;box-sizing:border-box">
      ${opts.map(o=>`<option${o===cur?' selected':''}>${o}</option>`).join('')}
    </select>
  </div>`;
}
function _ea(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Expose globally so other scripts (member.js) can check AUTH.isOwner
window.AUTH = AUTH;

// ── Resize/compress an image file client-side before upload ────
// GitHub's Contents API rejects files over ~1MB; phone photos are
// routinely 3-8MB, so every upload silently failed without this.
function _resizeImageToJpegBase64(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Không đọc được ảnh, thử lại với ảnh khác.')); };
    img.src = objUrl;
  });
}

// ── Cover / Background image upload via GitHub API ─────────────
async function _uploadCoverFile(input, urlInputId, statusId, previewId) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById(statusId);
  const urlInput = document.getElementById(urlInputId);
  if (statusEl) statusEl.textContent = '⏳ Đang nén và upload…';
  try {
    const b64   = await _resizeImageToJpegBase64(file);
    const fname = 'images/covers/' + Date.now() + '-' + Math.random().toString(36).slice(2,6) + '.jpg';
    await AUTH.ghPutRaw(fname, b64, 'Upload: ' + file.name);
    const url = 'https://raw.githubusercontent.com/' + GH_REPO + '/main/' + fname;
    if (urlInput) urlInput.value = url;
    if (statusEl) statusEl.textContent = '✅ Upload xong!';
    // Update preview images
    const ids = [previewId, 'se_prev', 'as-prev'].filter(Boolean);
    ids.forEach(pid => {
      const img = document.getElementById(pid);
      if (img) { img.src = url; img.style.display = 'block'; }
    });
  } catch(err) {
    if (statusEl) statusEl.textContent = '❌ ' + err.message;
  }
}
window._uploadCoverFile = _uploadCoverFile;

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _injectModal();
  _prefillLoginModal(); // auto-fill saved credentials if "remember" was checked
  _initHeader();
});
