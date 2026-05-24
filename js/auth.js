/* ================================================================
   auth.js – Owner Login · GitHub API · Inline Edit Mode
   Lưu Ly Hiền Nhi Các | luulyhnc.github.io/luulyhiennhicac
================================================================ */
'use strict';

// ── Constants ──────────────────────────────────────────────────
const OWNER_EMAIL = 'lethuhien211094@gmail.com';
const GH_REPO     = 'luulyhnc/luulyhiennhicac';
const DATA_FILE   = 'data/stories.json';
const _SK         = '_llhnc_s';   // session key
const _PK         = '_llhnc_p';   // PAT key

// ── AUTH ───────────────────────────────────────────────────────
const AUTH = {
  get isOwner() {
    try { const s = JSON.parse(localStorage.getItem(_SK)||'{}'); return !!(s.ok && Date.now() < s.exp); }
    catch { return false; }
  },
  get pat() { return localStorage.getItem(_PK) || ''; },

  async login(email, pat) {
    if (email.trim().toLowerCase() !== OWNER_EMAIL.toLowerCase())
      throw new Error('Email không có quyền truy cập.');
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}`, {
      headers: { Authorization:`token ${pat}`, Accept:'application/vnd.github.v3+json' }
    });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.message || `Xác thực thất bại (${r.status}). Kiểm tra lại PAT.`);
    }
    const repo = await r.json();
    if (!repo.permissions?.push)
      throw new Error('PAT không có quyền ghi vào repo. Cần scope: repo → contents.');
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
    const info = await this.ghGet(DATA_FILE);
    const json = atob(info.content.replace(/\n/g,''));
    return { stories: JSON.parse(json), sha: info.sha };
  },

  async saveStories(stories, sha, msg = 'Online: cập nhật truyện') {
    return this.ghPut(DATA_FILE, JSON.stringify(stories, null, 2), msg, sha);
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
      <input id="_lp" type="password" placeholder="ghp_..."
        onkeydown="if(event.key==='Enter')_doLogin()"
        style="width:100%;padding:.5rem .72rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.87rem;font-family:inherit;outline:none;box-sizing:border-box">
      <div style="font-size:.72rem;color:#9fb8cc;margin-top:.3rem">
        Tạo tại <a href="https://github.com/settings/tokens/new?scopes=repo&description=LLHNC-Admin"
          target="_blank" style="color:#3ab3ca">GitHub Settings → Tokens</a> (scope: <b>repo</b>)
      </div>
    </div>
    <div id="_lerr" style="display:none;background:#fdecea;color:#e74c3c;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-bottom:.7rem"></div>
    <button id="_lbtn" onclick="_doLogin()"
      style="width:100%;padding:.58rem;background:#3ab3ca;color:#fff;border:none;border-radius:8px;font-size:.92rem;font-weight:600;cursor:pointer;font-family:inherit">
      🔐 Đăng nhập
    </button>
  </div>
</div>`);
}

async function _doLogin() {
  const email = document.getElementById('_le').value.trim();
  const pat   = document.getElementById('_lp').value.trim();
  const err   = document.getElementById('_lerr');
  const btn   = document.getElementById('_lbtn');
  err.style.display = 'none';
  btn.textContent = '⏳ Đang xác thực...'; btn.disabled = true;
  try {
    await AUTH.login(email, pat);
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
function openStoryEditor(storyId) {
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
    ${_fld('Ảnh bìa (URL)','se_c',s.cover||'')}
    ${_fld('Giới thiệu','se_d',s.description||'','textarea')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-bottom:.85rem">
      ${_sel('Trạng thái','se_st',['Đang ra','Hoàn thành','Tạm dừng'],s.status)}
      ${_sel('Nguồn','se_src',['Sáng tác','Dịch','ST'],s.source||'Sáng tác')}
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
    stories[idx] = { ...stories[idx],
      title:       document.getElementById('se_t').value.trim(),
      author:      document.getElementById('se_a').value.trim(),
      cover:       document.getElementById('se_c').value.trim(),
      description: document.getElementById('se_d').value.trim(),
      status:      document.getElementById('se_st').value,
      source:      document.getElementById('se_src').value,
    };
    _s('⏳ Đang lưu lên GitHub...', true);
    await AUTH.saveStories(stories, sha, `Online: sửa "${stories[idx].title}"`);
    _s('✅ Đã lưu! Web cập nhật trong ~1 phút.', true);
    setTimeout(() => { document.getElementById('_se_modal')?.remove(); location.reload(); }, 1400);
  } catch(e) { _s('❌ ' + e.message, false); }
}

// ── Chapter editor (from story.html chapter list) ──────────────
async function openChapterEditor(storyId, chapterId) {
  if (document.getElementById('_ce_modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
<div id="_ce_modal" onclick="if(event.target===this)this.remove()"
  style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto;font-family:'Inter',sans-serif">
  <div style="background:#fff;border-radius:14px;padding:1.5rem;width:100%;max-width:720px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>✏️ Sửa chương</b>
      <button onclick="document.getElementById('_ce_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button>
    </div>
    <div id="_ce_loading" style="text-align:center;padding:2rem;color:#9fb8cc">⏳ Đang tải nội dung...</div>
    <div id="_ce_form" style="display:none">
      ${_fld('Tên chương','ced_t','')}
      <div style="margin-bottom:.85rem">
        <div style="font-size:.78rem;font-weight:500;color:#4a6080;margin-bottom:.28rem">Nội dung</div>
        <textarea id="ced_c" rows="20"
          style="width:100%;padding:.75rem;border:1.5px solid #c5dce9;border-radius:8px;font-size:.88rem;font-family:'Merriweather',Georgia,serif;line-height:1.8;resize:vertical;box-sizing:border-box;outline:none"></textarea>
      </div>
      <div id="_ce_msg" style="display:none;padding:.45rem .7rem;border-radius:7px;font-size:.8rem;margin-bottom:.7rem"></div>
      <div style="display:flex;gap:.5rem;justify-content:flex-end">
        <button onclick="document.getElementById('_ce_modal').remove()"
          style="padding:.5rem 1rem;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;background:#fff;font-family:inherit">Hủy</button>
        <button onclick="_saveCh('${storyId}',${chapterId})"
          style="padding:.5rem 1.1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-weight:600">💾 Lưu & Deploy</button>
      </div>
    </div>
  </div>
</div>`);
  try {
    const { stories } = await AUTH.loadStories();
    const ch = stories.find(s=>s.id===storyId)?.chapters.find(c=>c.id===chapterId);
    if (!ch) throw new Error('Không tìm thấy chương!');
    document.getElementById('ced_t').value = ch.title;
    document.getElementById('ced_c').value = ch.content;
    document.getElementById('_ce_loading').style.display = 'none';
    document.getElementById('_ce_form').style.display = 'block';
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
      <b style="font-size:1rem;color:#1a2535">🤖 AI Kiểm duyệt nội dung</b>
      <button onclick="document.getElementById('_ai_modal').remove()"
        style="border:none;background:#f0f4f8;width:30px;height:30px;border-radius:50%;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;gap:.5rem;margin-bottom:.85rem;flex-wrap:wrap">
      <input id="_ai_key" type="password" placeholder="Gemini API Key (miễn phí tại aistudio.google.com)"
        value="${_ea(savedKey)}"
        style="flex:1;min-width:200px;padding:.45rem .7rem;border:1.5px solid #c5dce9;border-radius:7px;font-size:.84rem;font-family:inherit;outline:none">
      <button onclick="_saveAiKey()"
        style="padding:.45rem .9rem;background:#f0f4f8;border:1.5px solid #c5dce9;border-radius:7px;cursor:pointer;font-size:.83rem;font-family:inherit">💾 Lưu key</button>
      <button onclick="_runAiCheckAll()"
        style="padding:.45rem 1rem;background:#3ab3ca;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:.85rem;font-weight:600;font-family:inherit">▶ Kiểm tra tất cả</button>
    </div>
    <div id="_ai_status" style="font-size:.8rem;color:#9fb8cc;margin-bottom:.8rem">Nhập Gemini API Key rồi bấm "Kiểm tra tất cả".</div>
    <div id="_ai_results"></div>
  </div>
</div>`);
}

function _saveAiKey() {
  const key = (document.getElementById('_ai_key')?.value || '').trim();
  localStorage.setItem('_llhnc_gk', key);
  const st = document.getElementById('_ai_status');
  if (st) st.textContent = key ? '✅ Đã lưu API Key.' : '⚠️ Key trống.';
}

async function _runAiCheckAll() {
  const keyEl = document.getElementById('_ai_key');
  const apiKey = (keyEl?.value || '').trim() || localStorage.getItem('_llhnc_gk') || '';
  const st = document.getElementById('_ai_status');
  const results = document.getElementById('_ai_results');
  if (!apiKey) { if (st) st.textContent = '❌ Vui lòng nhập Gemini API Key.'; return; }
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
      <div id="${rid}" style="background:#f8fafc;border:1.5px solid #dce8f5;border-radius:9px;padding:.75rem 1rem;margin-bottom:.55rem;display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <b style="font-size:.87rem;color:#1a2535">${_ea(s.title)}</b>
          <span style="font-size:.74rem;color:#9fb8cc;margin-left:.35rem">${_ea(s.author)}</span>
          ${s.hidden?'<span style="font-size:.7rem;background:#fdecea;color:#e74c3c;border-radius:4px;padding:.1rem .35rem;margin-left:.3rem">Đã ẩn</span>':''}
        </div>
        <span id="${rid}_badge" style="font-size:.78rem;color:#9fb8cc">⏳ Đang phân tích...</span>
        <div id="${rid}_act" style="display:flex;gap:.4rem"></div>
      </div>`);

    st.textContent = `Kiểm tra (${i+1}/${stories.length}): ${s.title}`;
    try {
      const r = await _aiCheckStory(s, apiKey);
      const badge = document.getElementById(rid+'_badge');
      const act   = document.getElementById(rid+'_act');
      const row   = document.getElementById(rid);
      if (!badge) continue;
      if (r.safe) {
        badge.innerHTML = `<span style="color:#27ae60">✅ An toàn</span> <span style="font-size:.7rem;color:#b0c4d8">(${r.score}/10)</span>`;
      } else {
        badge.innerHTML = `<span style="color:#e74c3c">⚠️ ${_ea(r.recommendation)}</span> <span style="font-size:.7rem;color:#b0c4d8">(${r.score}/10)</span>`;
        if (r.issues?.length && row)
          row.insertAdjacentHTML('beforeend',`<div style="width:100%;font-size:.76rem;color:#c0392b;background:#fdecea;padding:.3rem .55rem;border-radius:5px;margin-top:.3rem">${r.issues.map(x=>'• '+_ea(x)).join('<br>')}</div>`);
        if (act && !s.hidden)
          act.innerHTML=`<button onclick="_toggleHideStory('${s.id}',true,'${_ea(s.title)}')" style="padding:.22rem .6rem;background:#fdecea;color:#e74c3c;border:1.5px solid #f0b8bc;border-radius:6px;cursor:pointer;font-size:.77rem;font-family:inherit">🙈 Ẩn</button>`;
      }
      if (act && s.hidden)
        act.innerHTML=`<button onclick="_toggleHideStory('${s.id}',false,'${_ea(s.title)}')" style="padding:.22rem .6rem;background:#e8f5e9;color:#27ae60;border:1.5px solid #a8d5b5;border-radius:6px;cursor:pointer;font-size:.77rem;font-family:inherit">👁 Hiện</button>`;
    } catch(e) {
      const badge = document.getElementById(rid+'_badge');
      if (badge) badge.innerHTML=`<span style="color:#e74c3c">❌ ${_ea(e.message)}</span>`;
    }
    await new Promise(r => setTimeout(r, 600)); // rate limit buffer
  }
  st.textContent = `✅ Đã kiểm tra xong ${stories.length} truyện.`;
}

async function _aiCheckStory(story, apiKey) {
  const sample = story.chapters.slice(0,2).map(c=>(c.content||'').slice(0,600)).join('\n---\n');
  const prompt = `Bạn là hệ thống kiểm duyệt nội dung tự động cho website đọc truyện Việt Nam hợp pháp. Phân tích truyện sau:

Tên: ${story.title}
Tác giả: ${story.author}
Mô tả: ${story.description}
Nội dung mẫu: ${sample}

Xác định các nội dung vi phạm: chính trị/kích động, bạo lực cực đoan, 18+/khiêu dâm, thông tin sai lệch nguy hại, phân biệt chủng tộc/tôn giáo.

Chỉ trả về JSON, không giải thích:
{"safe":true,"score":0,"issues":[],"recommendation":"an toàn"}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.1,maxOutputTokens:200} }) }
  );
  if (!resp.ok) { const e=await resp.json().catch(()=>({})); throw new Error(e.error?.message||`HTTP ${resp.status}`); }
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const m = text.match(/\{[\s\S]*?\}/);
  try { return m ? JSON.parse(m[0]) : {safe:true,score:0,issues:[],recommendation:'an toàn'}; }
  catch { return {safe:true,score:0,issues:[],recommendation:'an toàn'}; }
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

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _injectModal();
  _initHeader();
});
