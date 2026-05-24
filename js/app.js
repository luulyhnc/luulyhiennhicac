// ══════════════════════════════════════════════
//  CONFIG — thay link affiliate thật vào đây
// ══════════════════════════════════════════════
const AFFILIATE_ADS = [
  {
    title: "🛍️ Shopee Sale Hôm Nay",
    desc:  "Giảm đến 50% hàng ngàn sản phẩm – Click để xem ngay!",
    url:   "https://shope.ee/your-affiliate-link-here"
  },
  {
    title: "📚 Khóa Học Online Giảm 80%",
    desc:  "Học lập trình, thiết kế tại nhà. Ưu đãi có hạn!",
    url:   "https://your-affiliate-link-2.com"
  },
  {
    title: "🎮 Nạp Game Giá Tốt Nhất",
    desc:  "Nạp thẻ game uy tín, giá rẻ, xử lý tức thì 24/7.",
    url:   "https://your-affiliate-link-3.com"
  }
];

const INTERSTITIAL_SECONDS = 5;
const CHAPTERS_PER_PAGE    = 50;

// ══════════════════════════════════════════════
//  APPLY INTERFACE SETTINGS (from admin panel)
// ══════════════════════════════════════════════
(function applyIfaceSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('_llhnc_iface') || '{}');

    // Primary color
    if (s.color) {
      document.documentElement.style.setProperty('--primary', s.color);
      document.documentElement.style.setProperty('--pri-d', s.color);
    }

    // Font family — load from Google Fonts dynamically
    if (s.fontFamily) {
      const gfName = s.fontFamily.replace(/['"]/g,'').split(',')[0].trim();
      const safeId = '_gf_' + gfName.replace(/\s+/g,'_');
      if (gfName && !['Inter','Georgia','Be Vietnam Pro'].includes(gfName) && !document.getElementById(safeId)) {
        const lk = document.createElement('link');
        lk.id   = safeId; lk.rel = 'stylesheet';
        lk.href = 'https://fonts.googleapis.com/css2?family='
          + encodeURIComponent(gfName).replace(/%20/g,'+')
          + ':wght@400;700;900&display=swap';
        document.head.appendChild(lk);
      }
      document.documentElement.style.setProperty('--font-logo', s.fontFamily);
    }

    // Logo size + effect — applied after DOM ready
    const applyLogo = () => {
      document.querySelectorAll('.logo-main').forEach(el => {
        if (s.fontFamily) el.style.fontFamily = s.fontFamily;
        if (s.logoSize)   el.style.fontSize   = s.logoSize + 'em';

        // Clear previous effects
        el.style.fontWeight = ''; el.style.fontStyle = '';
        el.style.textShadow = ''; el.style.background = '';
        el.style.webkitBackgroundClip = ''; el.style.webkitTextFillColor = '';
        el.style.backgroundClip = ''; el.style.animation = '';
        el.style.overflow = ''; el.style.borderRight = ''; el.style.whiteSpace = '';

        const color = s.color || '#3ab3ca';
        // Support both legacy string and new array format
        const fxRaw = s.logoEffect || [];
        const fx    = Array.isArray(fxRaw) ? fxRaw : (fxRaw === 'normal' ? [] : [fxRaw]);
        // Apply multiple effects
        if (fx.includes('bold')   || fx.includes('bold-i')) el.style.fontWeight = '900';
        if (fx.includes('italic') || fx.includes('bold-i')) el.style.fontStyle  = 'italic';
        if (fx.includes('3d')) el.style.textShadow = `2px 2px 0 rgba(0,0,0,.22),4px 4px 0 rgba(0,0,0,.1)`;
        if (fx.includes('anim')) {
          el.style.background = `linear-gradient(90deg,${color},#e74c8b,#8e44ad,${color})`;
          el.style.backgroundSize = '300%';
          el.style.webkitBackgroundClip = 'text'; el.style.webkitTextFillColor = 'transparent';
          el.style.backgroundClip = 'text'; el.style.animation = 'logo-shimmer 3s linear infinite';
        } else if (fx.includes('gradient')) {
          el.style.background = `linear-gradient(135deg,${color} 0%,#e74c8b 50%,${color} 100%)`;
          el.style.webkitBackgroundClip = 'text'; el.style.webkitTextFillColor = 'transparent';
          el.style.backgroundClip = 'text';
        }
        if (fx.includes('typing')) {
          el.style.overflow = 'hidden'; el.style.borderRight = `2px solid ${color}`;
          el.style.whiteSpace = 'nowrap'; el.style.display = 'inline-block';
          el.style.animation = 'logo-typing 3.5s steps(20) infinite';
        }
      });

      // Logo image (replaces text logo with an actual <img> — supports GIF)
      if (s.logoImg) {
        const h = s.logoImgH || 48;
        document.querySelectorAll('.logo-main').forEach(el => {
          el.innerHTML = '<img src="' + s.logoImg + '" style="height:' + h + 'px;max-width:240px;object-fit:contain;vertical-align:middle;display:inline-block" alt="logo">';
          el.style.fontWeight = ''; el.style.fontStyle = ''; el.style.textShadow = '';
          el.style.background = ''; el.style.webkitTextFillColor = '';
          el.style.animation  = '';
        });
        if (s.logoImgSlogan === 'hide') {
          document.querySelectorAll('.logo-slogan').forEach(el => { el.style.display = 'none'; });
        }
      }

      // Background image — use <img> element so GIF animation always works
      if (s.bgImage) {
        const dim     = (s.bgDim    !== undefined ? s.bgDim    : 30);
        const fit     = s.bgFit    || 'cover';
        const scroll  = s.bgScroll || 'scroll';
        const opacity = ((100 - dim) / 100).toFixed(2);
        const target  = s.bgTarget || 'hero';

        // Remove any previously injected bg-img layers
        document.querySelectorAll('.llhnc-bg-img').forEach(el => el.remove());

        // Build the <img> layer
        const makeLayer = () => {
          const wrap = document.createElement('div');
          wrap.className = 'llhnc-bg-img';
          const posn = (scroll === 'fixed') ? 'fixed' : 'absolute';
          wrap.style.cssText = 'position:' + posn + ';inset:0;z-index:0;overflow:hidden;pointer-events:none;';
          const img = document.createElement('img');
          img.src = s.bgImage;
          img.alt = '';
          img.style.cssText = [
            'width:100%', 'height:100%', 'display:block',
            'object-fit:' + (fit === 'repeat' ? 'none' : fit),
            'object-position:center',
            'opacity:' + opacity,
          ].join(';');
          wrap.appendChild(img);
          return wrap;
        };

        if (target === 'body') {
          document.body.style.position = 'relative';
          document.body.insertBefore(makeLayer(), document.body.firstChild);
        } else if (target === 'header') {
          document.querySelectorAll('header').forEach(h => {
            h.style.position = 'relative'; h.style.overflow = 'hidden';
            h.insertBefore(makeLayer(), h.firstChild);
          });
        } else {
          // Hero banner
          const hero = document.querySelector('.hero-banner');
          if (hero) {
            hero.style.position = 'relative'; hero.style.overflow = 'hidden';
            hero.insertBefore(makeLayer(), hero.firstChild);
            // Keep existing content above the bg layer
            Array.from(hero.children).forEach(child => {
              if (!child.classList.contains('llhnc-bg-img')) {
                child.style.position = 'relative'; child.style.zIndex = '1';
              }
            });
          }
        }

        // Dark overlay on top of animated bg
        if (dim > 0) {
          const overlay = document.createElement('div');
          overlay.className = 'llhnc-bg-img llhnc-bg-overlay';
          const posn = (scroll === 'fixed') ? 'fixed' : 'absolute';
          overlay.style.cssText = 'position:' + posn + ';inset:0;z-index:1;pointer-events:none;background:rgba(0,0,0,' + (dim/100).toFixed(2) + ')';
          if (target === 'body') {
            document.body.insertBefore(overlay, document.body.children[1] || null);
          } else if (target === 'header') {
            document.querySelectorAll('header').forEach(h => h.appendChild(overlay.cloneNode()));
          } else {
            const hero = document.querySelector('.hero-banner');
            if (hero) hero.insertBefore(overlay, hero.children[1] || null);
          }
        }
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyLogo);
    } else {
      applyLogo();
    }

  } catch(e) { /* silently fail */ }
})();

// ══════════════════════════════════════════════
//  COPY PROTECTION & TRACKING
// ══════════════════════════════════════════════
(function initCopyProtection() {
  const _CL_KEY      = '_copy_logs';   // localStorage key for copy log
  const _CL_WH_KEY   = '_copy_webhook'; // webhook URL key
  const MAX_LOGS     = 1000;
  const SNIPPET_LEN  = 200;

  // ── Helper: is user logged in? ──────────────────────────────
  function _isLoggedIn() {
    if (typeof AUTH   !== 'undefined' && AUTH.isOwner)    return true;
    if (typeof MEMBER !== 'undefined' && MEMBER.isLoggedIn) return true;
    return false;
  }

  // ── Helper: current user info ──────────────────────────────
  function _getUser() {
    if (typeof AUTH   !== 'undefined' && AUTH.isOwner)    return { id:'admin', name:'Admin' };
    if (typeof MEMBER !== 'undefined' && MEMBER.currentUser) {
      const u = MEMBER.currentUser;
      return { id: u.id||u.username||'?', name: u.displayName||u.username||'Thành viên' };
    }
    return null;
  }

  // ── Log a copy event ───────────────────────────────────────
  function _logCopy(snippet) {
    try {
      const user    = _getUser();
      const ctx     = window._currentReaderCtx || {};
      const story   = ctx.story   || window._currentStory || {};
      const chapter = ctx.chapter || {};
      const entry = {
        ts:         Date.now(),
        userId:     user?.id   || 'unknown',
        userName:   user?.name || 'Khách',
        storyId:    story.id    || '',
        storyTitle: story.title || document.title || '',
        chapId:     chapter.id    || '',
        chapTitle:  chapter.title || '',
        snippet:    snippet.slice(0, SNIPPET_LEN),
        url:        location.href
      };

      // Save to localStorage
      const logs = JSON.parse(localStorage.getItem(_CL_KEY) || '[]');
      logs.unshift(entry);
      localStorage.setItem(_CL_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));

      // Send to webhook if configured
      const wh = localStorage.getItem(_CL_WH_KEY);
      if (wh) {
        fetch(wh, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        }).catch(() => {});
      }
    } catch(_) {}
  }

  // ── Block copy modal for guests ────────────────────────────
  function _showCopyBlock() {
    if (document.getElementById('_cpb_modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="_cpb_modal" onclick="if(event.target===this)this.remove()"
        style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit">
        <div style="background:#fff;border-radius:14px;padding:1.8rem 1.6rem;max-width:340px;width:90%;text-align:center;box-shadow:0 16px 50px rgba(0,0,0,.25)">
          <div style="font-size:2.2rem;margin-bottom:.5rem">🔒</div>
          <div style="font-size:1rem;font-weight:700;color:#1a2535;margin-bottom:.4rem">Vui lòng đăng nhập</div>
          <p style="font-size:.84rem;color:#5a7a9a;line-height:1.55;margin-bottom:1.1rem">
            Chỉ thành viên đã đăng nhập mới có thể sao chép nội dung truyện.<br>
            Đăng ký hoàn toàn <b>miễn phí</b>!
          </p>
          <div style="display:flex;gap:.6rem;justify-content:center">
            <a href="login.html" style="padding:.5rem 1.1rem;background:#3ab3ca;color:#fff;border-radius:8px;text-decoration:none;font-size:.87rem;font-weight:600">Đăng nhập</a>
            <a href="register.html" style="padding:.5rem 1.1rem;background:#f0f4f8;color:#3ab3ca;border:1.5px solid #3ab3ca;border-radius:8px;text-decoration:none;font-size:.87rem;font-weight:600">Đăng ký</a>
            <button onclick="document.getElementById('_cpb_modal').remove()"
              style="padding:.5rem .9rem;background:#f0f4f8;border:1.5px solid #dde;border-radius:8px;cursor:pointer;font-size:.87rem;font-family:inherit">Đóng</button>
          </div>
        </div>
      </div>`);
  }

  // ── CSS: disable selection for guests, allow for members ──
  function _applySelectCSS() {
    const id = '_copy_prot_style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .chapter-body, .story-desc, .desc-box {
        -webkit-user-select: none;
        user-select: none;
      }
      body.is-member .chapter-body,
      body.is-member .story-desc,
      body.is-member .desc-box,
      body.is-owner  .chapter-body,
      body.is-owner  .story-desc,
      body.is-owner  .desc-box {
        -webkit-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Apply body class for member state ─────────────────────
  function _applyBodyClass() {
    if (typeof AUTH   !== 'undefined' && AUTH.isOwner)      document.body.classList.add('is-owner');
    if (typeof MEMBER !== 'undefined' && MEMBER.isLoggedIn) document.body.classList.add('is-member');
  }

  // ── Intercept copy / right-click ──────────────────────────
  document.addEventListener('copy', function(e) {
    if (!_isLoggedIn()) {
      e.preventDefault();
      e.stopPropagation();
      _showCopyBlock();
      return;
    }
    const sel = window.getSelection()?.toString()?.trim() || '';
    if (sel.length > 5) _logCopy(sel);
  }, true);

  document.addEventListener('contextmenu', function(e) {
    // Only block right-click on chapter content for guests
    if (_isLoggedIn()) return;
    const target = e.target.closest('.chapter-body');
    if (!target) return;
    e.preventDefault();
    _showCopyBlock();
  });

  // Keyboard shortcut block for guests
  document.addEventListener('keydown', function(e) {
    if (_isLoggedIn()) return;
    const onContent = e.target.closest('.chapter-body');
    if (!onContent) return;
    if ((e.ctrlKey || e.metaKey) && ['c','a','x'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      _showCopyBlock();
    }
  });

  // ── Init on DOM ready ─────────────────────────────────────
  const _init = () => { _applySelectCSS(); _applyBodyClass(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();

  // Export log helpers for admin use
  window._copyLogs = {
    getAll: ()       => { try { return JSON.parse(localStorage.getItem(_CL_KEY) || '[]'); } catch { return []; } },
    clear:  ()       => { localStorage.removeItem(_CL_KEY); },
    setWebhook: url  => { if(url) localStorage.setItem(_CL_WH_KEY, url); else localStorage.removeItem(_CL_WH_KEY); },
    getWebhook: ()   => localStorage.getItem(_CL_WH_KEY) || '',
  };
})();

// ══════════════════════════════════════════════
//  SCREENSHOT PROTECTION
// ══════════════════════════════════════════════
(function initScreenshotProtection() {
  // Block print / Save-as-PDF
  const noPrint = document.createElement('style');
  noPrint.id = '_noscr_style';
  noPrint.textContent = '@media print{html,body{display:none!important;visibility:hidden!important}}';
  document.head.appendChild(noPrint);

  // Toast notification
  function _ssToast(msg) {
    if (document.getElementById('_ss_toast')) return;
    const el = document.createElement('div');
    el.id = '_ss_toast';
    el.style.cssText = [
      'position:fixed','top:1.1rem','left:50%','transform:translateX(-50%)',
      'background:#1a2535','color:#fff','padding:.6rem 1.5rem',
      'border-radius:10px','font-size:.82rem','z-index:999999',
      'box-shadow:0 4px 24px rgba(0,0,0,.45)','font-family:Inter,sans-serif',
      'pointer-events:none','transition:opacity .5s','white-space:nowrap'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 2800);
  }

  // Block PrintScreen key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      navigator.clipboard?.writeText?.('');
      _ssToast('📵 Nội dung được bảo vệ – Không cho phép chụp màn hình.');
    }
    // Block Ctrl+P (print)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      _ssToast('📵 Không cho phép in / xuất PDF trang này.');
    }
  }, true);

  // Low-opacity watermark on chapter content (deters screen-sharing abuse)
  function _stamp() {
    document.querySelectorAll('.chapter-body:not([data-wm="1"])').forEach(body => {
      body.dataset.wm = '1';
      if (getComputedStyle(body).position === 'static') body.style.position = 'relative';
      let user = 'Lưu Ly Hiền Nhi Các';
      if (typeof AUTH   !== 'undefined' && AUTH.isOwner)      user = 'Admin';
      else if (typeof MEMBER !== 'undefined' && MEMBER.isLoggedIn) {
        const u = MEMBER.user; user = u?.username || u?.email || 'Thành viên';
      }
      const txt = (user + '  ·  luulyhnc.github.io   ').repeat(20);
      const wm  = document.createElement('div');
      wm.setAttribute('aria-hidden', 'true');
      wm.style.cssText = [
        'position:absolute','inset:0','pointer-events:none','z-index:0',
        'overflow:hidden','opacity:.045','user-select:none',
        'word-break:break-all','line-height:3.4','font-size:.75rem',
        'font-weight:700','color:#000',
        'transform:rotate(-22deg) scale(1.5)','transform-origin:center',
        'padding:2rem','white-space:normal'
      ].join(';');
      wm.textContent = txt;
      body.prepend(wm);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(_stamp, 900);
    new MutationObserver(_stamp).observe(document.body, { childList: true, subtree: true });
  });
})();

// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════
let _storiesCache = null;
let _seriesCacheT = 0;   // timestamp when cache was filled
let _seriesCache  = null;
const _CACHE_TTL  = 90 * 1000; // 90 seconds — balance freshness vs. bandwidth

async function fetchStories(forceRefresh) {
  // Always bypass browser/CDN cache via unique timestamp parameter.
  // A new page load always fetches fresh; _storiesCache only deduplicates
  // repeated calls *within the same page load* (e.g. multiple components).
  if (_storiesCache && !forceRefresh) return _storiesCache;
  const res = await fetch("data/stories.json?_=" + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error("Không thể tải dữ liệu truyện (" + res.status + ")");
  _storiesCache = await res.json();
  return _storiesCache;
}

async function fetchSeries(forceRefresh) {
  const now = Date.now();
  if (_seriesCache && !forceRefresh && (now - _seriesCacheT) < _CACHE_TTL) return _seriesCache;
  try {
    const res = await fetch("data/series.json?_=" + now, { cache: 'no-store' });
    _seriesCache  = await res.json();
    _seriesCacheT = now;
  } catch { _seriesCache = _seriesCache || []; }
  return _seriesCache;
}

async function findStory(id) {
  const list = await fetchStories();
  return list.find(s => s.id === id) || null;
}

// ══════════════════════════════════════════════
//  URL HELPERS  (hash-based routing)
// ══════════════════════════════════════════════
function getHash() { return location.hash.slice(1); }
function storyUrl(id) { return "story.html#" + id; }
function readerUrl(storyId, chapterId) { return "reader.html#" + storyId + "/" + chapterId; }

// ══════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════
function doSearch() {
  const q = (document.getElementById("search-input") || {}).value || "";
  if (q.trim()) location.href = "index.html?search=" + encodeURIComponent(q.trim());
}

// ══════════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════════
async function loadHomePage() {
  const listEl  = document.getElementById("story-list");
  const heading = document.getElementById("section-heading");
  if (!listEl) return;

  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";
  const genre  = params.get("genre")  || "";
  const status = params.get("status") || "";

  let all = await fetchStories();

  // Filter out admin-hidden stories (AI moderation) — owner still sees all
  const allVisible = window.AUTH?.isOwner ? all : all.filter(s => !s.hidden);

  // Render hero, sidebar and series row with visible list
  renderHero(allVisible[0], allVisible);
  renderSidebar(allVisible);
  renderSeriesSection(allVisible);

  // Apply filter
  let stories = [...allVisible];
  if (search) {
    stories = stories.filter(s =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase())
    );
    if (heading) heading.textContent = `Kết quả: "${search}"`;
  } else if (genre) {
    stories = stories.filter(s => s.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    if (heading) heading.textContent = "Thể loại: " + genre;
  } else if (status) {
    stories = stories.filter(s => s.status.toLowerCase() === status.toLowerCase());
    if (heading) heading.textContent = status;
  }

  if (!stories.length) {
    listEl.innerHTML = `<div class="empty-state"><div class="icon">😢</div><p>Không tìm thấy truyện phù hợp.</p></div>`;
    return;
  }

  listEl.innerHTML = `<div class="story-grid">${stories.map(s => storyCardV(s)).join("")}</div>`;
}

function renderHero(s, all) {
  if (!s) return;
  const elTitle  = document.getElementById("hero-title");
  const elAuthor = document.getElementById("hero-author");
  const elTags   = document.getElementById("hero-tags");
  const elDesc   = document.getElementById("hero-desc");
  const elBtns   = document.getElementById("hero-btns");
  const elCovers = document.getElementById("hero-covers");

  if (elTitle)  elTitle.textContent = s.title;
  if (elAuthor) elAuthor.innerHTML  = `Tác giả: <strong>${s.author}</strong>`;
  if (elTags)   elTags.innerHTML    = s.genre.map(g => `<span class="hero-tag">${g}</span>`).join("");
  if (elDesc)   elDesc.textContent  = s.description;

  if (elBtns) {
    const firstCh = s.chapters[0];
    elBtns.innerHTML = firstCh
      ? `<a href="${readerUrl(s.id, firstCh.id)}" class="btn-primary">▶ Đọc ngay</a>
         <a href="${storyUrl(s.id)}" class="btn-outline-white">📖 Xem chi tiết</a>`
      : `<a href="${storyUrl(s.id)}" class="btn-primary">Xem chi tiết</a>`;
  }

  if (elCovers) {
    const mainImg = s.cover
      ? `<img src="${s.cover}" alt="${s.title}" class="hero-cover-main">`
      : `<div class="hero-cover-main hero-cover-ph">📚</div>`;
    const sides = all.slice(1, 3).map(ss => ss.cover
      ? `<img src="${ss.cover}" alt="${ss.title}" class="hero-cover-side">`
      : `<div class="hero-cover-side hero-cover-ph">📖</div>`
    ).join("");
    elCovers.innerHTML = mainImg + (sides ? `<div class="hero-cover-stack">${sides}</div>` : "");
  }
}

// _rankData caches the full sorted list for tab switching
window._rankData = [];

function renderSidebar(stories) {
  const rankList  = document.getElementById("rank-list");
  const trendTags = document.getElementById("trend-tags");

  if (rankList) {
    // Sort by chapters desc (proxy for activity since we have no real view stats)
    window._rankData = [...stories].sort((a, b) =>
      ((b.chapters?.length || 0) + (b.views || 0) * 0.001) -
      ((a.chapters?.length || 0) + (a.views || 0) * 0.001)
    );
    _renderRankList(rankList, window._rankData);
  }

  if (trendTags) {
    const genres = [...new Set(stories.flatMap(s => s.genre || []))];
    const list   = genres.length ? genres
      : ["Tiên Hiệp","Huyền Huyễn","Ngôn Tình","Đô Thị","Nữ Cường","Kiếm Hiệp","Lịch Sử"];
    trendTags.innerHTML = list.map(g =>
      `<a class="trend-tag" href="index.html?genre=${encodeURIComponent(g)}">${g}</a>`
    ).join("");
  }
}

function _renderRankList(el, list) {
  el.innerHTML = list.slice(0, 8).map((s, i) => `
    <a class="rank-item" href="${storyUrl(s.id)}">
      <span class="rank-num ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</span>
      ${s.cover
        ? `<img src="${s.cover}" alt="${s.title}" class="rank-cover" loading="lazy">`
        : `<div class="rank-cover-ph">📚</div>`}
      <div class="rank-info">
        <div class="rank-title">${s.title}</div>
        <div class="rank-meta">⭐ ${s.rating||4.5} · 📖 ${s.chapters?.length||0} ch</div>
      </div>
    </a>`).join("");
}

// ── Series section on homepage ──────────────────────────────────
async function renderSeriesSection(stories) {
  const wrap = document.getElementById("series-home-wrap");
  const row  = document.getElementById("series-home-row");
  const vall = document.getElementById("series-home-viewall");
  if (!wrap || !row) return;

  let seriesList = [];
  try { seriesList = await fetchSeries(); } catch(_) { return; }
  if (!seriesList || !seriesList.length) { wrap.style.display = "none"; return; }

  wrap.style.display = "";

  row.innerHTML = seriesList.map(ser => {
    const storyCount = stories.filter(s => s.seriesId === ser.id).length;
    const volText    = ser.totalVolumes
      ? `${storyCount}/${ser.totalVolumes} tập`
      : `${storyCount} tập`;
    const isDone     = ser.status === "Hoàn thành";
    const statusCls  = isDone ? "rb-ok" : "rb-reader";
    const statusLbl  = isDone ? "Hoàn thành" : (ser.status || "Đang ra");
    const genres     = Array.isArray(ser.genre) ? ser.genre : (ser.genre ? [ser.genre] : []);
    const genreText  = genres.slice(0,2).join(" · ");

    return `<a class="series-card-h" href="series.html#${ser.id}">
      ${ser.cover
        ? `<img src="${ser.cover}" alt="${ser.title}" class="series-card-h-cover" loading="lazy">`
        : `<div class="series-card-h-ph">📚</div>`}
      <div class="series-card-h-info">
        <div class="series-card-h-title">${ser.title}</div>
        <div class="series-card-h-author">${ser.author || ""}</div>
        <div class="series-card-h-meta">
          <span class="rb ${statusCls}">${statusLbl}</span>
          <span style="font-size:.67rem;color:var(--text3)">📖 ${volText}</span>
          ${genreText ? `<span style="font-size:.63rem;color:var(--text3)">${genreText}</span>` : ""}
        </div>
      </div>
    </a>`;
  }).join("");
}

function switchRankTab(btn, period) {
  document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById("rank-list");
  if (!el || !window._rankData?.length) return;
  // All periods show the same base ranking for now (no per-period stats stored)
  // Could be extended with real data later
  _renderRankList(el, window._rankData);
}

// ── Vertical grid card (homepage) ──────────────────────────────
function storyCardV(s) {
  const chapCount = s.chapters?.length || 0;
  const isDone    = s.status === "Hoàn thành";
  const isHot     = (s.views || 0) > 1000;

  const coverHtml = s.cover
    ? `<img src="${s.cover}" alt="${s.title}" class="card-v-cover" loading="lazy">`
    : `<div class="card-v-ph">📚</div>`;

  const newBadge  = chapCount > 0 ? `<span class="badge-vn">Mới</span>` : "";
  const hotBadge  = isHot          ? `<span class="badge-vh">Hot</span>` : "";
  const fullBadge = isDone         ? `<span class="badge-vf">Full</span>` : "";

  const seriesBadge = s.seriesId
    ? `<a href="series.html#${s.seriesId}" onclick="event.stopPropagation()"
         style="display:inline-block;background:rgba(58,179,202,.18);color:#fff;border-radius:4px;padding:.08rem .38rem;font-size:.58rem;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,.35)">
         📚 Tập ${s.seriesOrder||"?"}</a>`
    : "";

  return `
    <div class="card-v" onclick="location.href='${storyUrl(s.id)}'">
      <div class="card-v-cover-wrap">
        ${coverHtml}
        <div class="card-v-badges">${newBadge}${hotBadge}</div>
        ${fullBadge}
        <div class="card-v-bar">
          <span>📖 ${chapCount} ch ${seriesBadge}</span>
          <span>⭐ ${s.rating || 4.5}</span>
        </div>
      </div>
      <div class="card-v-body">
        <div class="card-v-title">${s.title}</div>
        <div class="card-v-author">${s.author}</div>
        <div class="card-v-tags">
          ${(s.genre || []).slice(0, 2).map(g => `<span class="tag">${g}</span>`).join("")}
        </div>
      </div>
    </div>`;
}

// ── Horizontal card (used on story/series pages) ────────────────
function storyCardH(s) {
  const firstCh = s.chapters[0];
  const sc = s.status === "Hoàn thành" ? "bs-done" : "bs-ongoing";
  return `
    <div class="card-h" onclick="location.href='${storyUrl(s.id)}'">
      ${s.cover
        ? `<img src="${s.cover}" alt="${s.title}" class="card-h-cover" loading="lazy">`
        : `<div class="card-h-ph">📚</div>`}
      <div class="card-h-info">
        <div class="card-h-title">${s.title}</div>
        <div class="card-h-author">${s.author}</div>
        <div class="card-h-tags">
          ${s.genre.slice(0,3).map(g=>`<span class="tag">${g}</span>`).join("")}
          <span class="badge-status-sm ${sc}">${s.status}</span>
        </div>
        <div class="card-h-desc">${s.description}</div>
        <div class="card-h-stats">
          <span><span class="stat-star">⭐</span>${s.rating||4.5}</span>
          <span>👁 ${fmtNum(s.views||0)}</span>
          <span>📖 ${s.chapters.length} chương</span>
          ${firstCh ? `<span class="badge-new">Mới</span>` : ""}
          ${s.seriesId ? `<a href="series.html#${s.seriesId}" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:.2rem;background:var(--pri-l);color:var(--primary);border-radius:10px;padding:.08rem .45rem;font-size:.69rem;font-weight:700;text-decoration:none;border:1px solid var(--primary)">📚 Tập ${s.seriesOrder||'?'}</a>` : ""}
        </div>
      </div>
    </div>`;
}

function filterGenre(tabEl, genre) {
  document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  const url = genre ? `index.html?genre=${encodeURIComponent(genre)}` : 'index.html';
  history.pushState({}, '', url);
  loadHomePage();
}

// ══════════════════════════════════════════════
//  STORY DETAIL PAGE
// ══════════════════════════════════════════════
let _chapterSort = "asc";   // "asc" | "desc"
let _chapterPage = 0;

async function loadStoryPage() {
  const root    = document.getElementById("story-detail-root");
  const bcTitle = document.getElementById("bc-title");
  if (!root) return;

  _chapterPage = 0;
  _chapterSort = "asc";

  const id = getHash();
  if (!id) { root.innerHTML = errHtml("Không tìm thấy truyện."); return; }

  const story = await findStory(id);
  if (!story) { root.innerHTML = errHtml("Truyện không tồn tại."); return; }

  document.title = story.title + " – Lưu Ly Hiền Nhi Các";
  if (bcTitle) bcTitle.textContent = story.title;

  const firstCh  = story.chapters[0];
  const latestCh = story.chapters[story.chapters.length - 1];
  const rating   = story.rating || 4.5;
  const stars    = "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

  root.innerHTML = `
    <div class="story-layout">
      <div class="story-cover-wrap">
        <img src="${story.cover}" alt="${story.title}">
        <button class="follow-btn" id="follow-btn" onclick="toggleFollow('${story.id}')">
          ${isFollowed(story.id) ? "❤️ Đang theo dõi" : "🤍 Theo dõi"}
        </button>
      </div>

      <div class="story-info">
        <h1>${story.title}</h1>

        <div style="display:flex;align-items:center;gap:.5rem;margin:.3rem 0">
          <span class="stars">${stars}</span>
          <span class="star-count">${rating}/5 (${story.rateCount || Math.floor(Math.random()*800+100)} đánh giá)</span>
        </div>

        <div class="stat-row">
          <div class="stat-item"><div class="val">${fmtNum(story.views || 12500)}</div><div class="key">Lượt đọc</div></div>
          <div class="stat-item"><div class="val">${story.chapters.length}</div><div class="key">Chương</div></div>
          <div class="stat-item"><div class="val">${fmtNum(story.follows || 340)}</div><div class="key">Theo dõi</div></div>
        </div>

        <table class="story-meta-table">
          <tr><td>Tác giả</td><td><a href="index.html?search=${encodeURIComponent(story.author)}">${story.author}</a></td></tr>
          <tr><td>Thể loại</td><td>${story.genre.map(g=>`<a class="genre-tag" href="index.html?genre=${encodeURIComponent(g)}">${g}</a>`).join("")}</td></tr>
          <tr><td>Trạng thái</td><td><span style="color:${story.status==="Hoàn thành"?"var(--green)":"var(--primary)"}">${story.status}</span></td></tr>
          <tr><td>Nguồn</td><td>${story.source || "Tác giả tự viết"}</td></tr>
        </table>

        <div class="desc-box">${story.description}</div>

        ${story.audioUrl ? `
        <div style="margin:.9rem 0;padding:.75rem;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px">
          <div style="font-size:.75rem;font-weight:700;color:var(--text3);margin-bottom:.45rem;text-transform:uppercase;letter-spacing:.04em">🎧 Nghe truyện</div>
          <audio controls style="width:100%;outline:none;border-radius:6px" preload="none">
            <source src="${story.audioUrl}">
            Trình duyệt không hỗ trợ audio.
          </audio>
        </div>` : ''}

        ${story.videoUrl ? `
        <div style="margin:.9rem 0;padding:.75rem;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px">
          <div style="font-size:.75rem;font-weight:700;color:var(--text3);margin-bottom:.45rem;text-transform:uppercase;letter-spacing:.04em">🎬 Xem video</div>
          ${/youtu\.?be/.test(story.videoUrl)
            ? `<div style="position:relative;padding-bottom:56.25%;border-radius:8px;overflow:hidden">
                 <iframe src="https://www.youtube.com/embed/${story.videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]||''}"
                   style="position:absolute;inset:0;width:100%;height:100%;border:none" allowfullscreen loading="lazy"></iframe>
               </div>`
            : `<video controls style="width:100%;border-radius:8px;max-height:340px" preload="none">
                 <source src="${story.videoUrl}">
                 Trình duyệt không hỗ trợ video.
               </video>`}
        </div>` : ''}

        <div class="action-btns">
          ${firstCh  ? `<a href="${readerUrl(story.id, firstCh.id)}"  class="btn btn-accent">▶ Đọc từ đầu</a>` : ""}
          ${latestCh ? `<a href="${readerUrl(story.id, latestCh.id)}" class="btn btn-outline">⏭ Chương mới nhất</a>` : ""}
        </div>
      </div>
    </div>

    <div id="chapter-list-section"></div>
  `;

  renderChapterList(story);
  window._currentStory = story;
  if (window.AUTH?.isOwner && typeof initStoryEditMode === 'function') initStoryEditMode(story);

  // Show series box if story belongs to a series
  if (story.seriesId) {
    fetchSeries().then(allSeries => {
      const ser = allSeries.find(s => s.id === story.seriesId);
      if (!ser) return;
      fetchStories().then(allStories => {
        const siblings = allStories
          .filter(s => s.seriesId === story.seriesId && !s.hidden)
          .sort((a,b) => (a.seriesOrder||0) - (b.seriesOrder||0));
        const box = document.createElement('div');
        box.className = 'series-box';
        box.innerHTML = `
          <div class="series-box-hdr">
            <span class="series-box-icon">📚</span>
            <div>
              <div class="series-box-title"><a href="series.html#${ser.id}">${ser.title}</a></div>
              <div class="series-box-meta">${siblings.length} tập · ${ser.status||'Đang ra'}</div>
            </div>
          </div>
          <div class="series-taps">
            ${siblings.map(s => `
              <a href="story.html#${s.id}" class="series-tap${s.id===story.id?' active':''}">
                <span class="tap-num">Tập ${s.seriesOrder||'?'}</span>
                <span class="tap-title">${s.title}</span>
              </a>`).join('')}
          </div>`;
        const detailRoot = document.getElementById('story-detail-root');
        if (detailRoot) detailRoot.insertAdjacentElement('afterend', box);
      });
    });
  }
}

function renderChapterList(story) {
  const sec = document.getElementById("chapter-list-section");
  if (!sec) return;

  let chapters = [...story.chapters];
  if (_chapterSort === "desc") chapters.reverse();

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
  const pageChaps  = chapters.slice(_chapterPage * CHAPTERS_PER_PAGE, (_chapterPage + 1) * CHAPTERS_PER_PAGE);

  const pageButtons = totalPages > 1
    ? Array.from({ length: totalPages }, (_, i) =>
        `<button class="page-btn${i === _chapterPage ? " active" : ""}" onclick="gotoChapPage(${i},'${story.id}')">${i + 1}</button>`
      ).join("")
    : "";

  sec.innerHTML = `
    <div class="chap-list-wrap">
      <div class="chap-list-header">
        <span class="title">📋 Danh Sách Chương (${story.chapters.length})</span>
        <div class="chap-controls">
          <button class="chap-sort-btn${_chapterSort==="asc"?" active":""}"  onclick="setChapSort('asc','${story.id}')">↑ Tăng dần</button>
          <button class="chap-sort-btn${_chapterSort==="desc"?" active":""}" onclick="setChapSort('desc','${story.id}')">↓ Giảm dần</button>
        </div>
      </div>
      <div class="chap-grid">
        ${pageChaps.map((ch, idx) => {
          const realIdx = _chapterSort === "asc"
            ? _chapterPage * CHAPTERS_PER_PAGE + idx + 1
            : story.chapters.length - (_chapterPage * CHAPTERS_PER_PAGE + idx);
          return `<div class="chap-item" onclick="location.href='${readerUrl(story.id, ch.id)}'">
            <span class="chap-num">${realIdx}</span>
            <span class="chap-title">${ch.title}</span>
          </div>`;
        }).join("")}
      </div>
      ${totalPages > 1 ? `<div class="chap-pagination">${pageButtons}</div>` : ""}
    </div>
  `;
}

function setChapSort(sort, storyId) {
  _chapterSort = sort;
  _chapterPage = 0;
  findStory(storyId).then(s => s && renderChapterList(s));
}

function gotoChapPage(page, storyId) {
  _chapterPage = page;
  findStory(storyId).then(s => {
    if (s) {
      renderChapterList(s);
      document.getElementById("chapter-list-section").scrollIntoView({ behavior: "smooth" });
    }
  });
}

// ══════════════════════════════════════════════
//  READER PAGE
// ══════════════════════════════════════════════
async function loadReaderPage() {
  const root = document.getElementById("reader-root");
  if (!root) return;

  const [storyId, chapterStr] = getHash().split("/");
  const chapterId = parseInt(chapterStr, 10);

  if (!storyId || isNaN(chapterId)) {
    root.innerHTML = errHtml("Địa chỉ không hợp lệ.");
    return;
  }

  const story = await findStory(storyId);
  if (!story) { root.innerHTML = errHtml("Không tìm thấy truyện."); return; }

  const idx     = story.chapters.findIndex(c => c.id === chapterId);
  if (idx === -1) { root.innerHTML = errHtml("Không tìm thấy chương."); return; }

  const chapter  = story.chapters[idx];
  const prevCh   = idx > 0 ? story.chapters[idx - 1] : null;
  const nextCh   = idx < story.chapters.length - 1 ? story.chapters[idx + 1] : null;

  document.title = chapter.title + " – " + story.title + " – Lưu Ly Hiền Nhi Các";

  const tbTitle = document.getElementById("toolbar-title");
  const bcStory = document.getElementById("bc-story");
  const bcChap  = document.getElementById("bc-chapter");
  if (tbTitle) tbTitle.textContent = chapter.title;
  if (bcStory) { bcStory.textContent = story.title; bcStory.href = storyUrl(story.id); }
  if (bcChap)  bcChap.textContent = chapter.title;

  const navBtns = (bottom = false) => `
    <div class="reader-nav-${bottom ? "bottom" : "top"}">
      ${prevCh
        ? `<button class="btn btn-outline" onclick="goToChapter('${story.id}',${prevCh.id})">‹ Chương trước</button>`
        : `<button class="btn btn-outline" disabled style="opacity:.35">‹ Chương trước</button>`}
      <a href="${storyUrl(story.id)}" class="btn btn-outline">📋 Mục lục</a>
      ${nextCh
        ? `<button class="btn btn-accent" onclick="goToChapter('${story.id}',${nextCh.id})">Chương tiếp ›</button>`
        : `<button class="btn btn-accent" disabled style="opacity:.35">Chương tiếp ›</button>`}
    </div>
  `;

  const _cq = chapter.chapQuote
    ? `<div style="text-align:center;font-style:italic;color:var(--text2);padding:.85rem 2rem 1rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:1.4rem;font-size:.91rem;line-height:1.75;background:var(--bg2)">"${chapter.chapQuote.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</div>`
    : '';
  root.innerHTML = `
    ${navBtns(false)}
    ${_cq}
    <div class="reader-body" id="chapter-body">${renderChapterContent(chapter.content)}</div>
    ${navBtns(true)}
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
  window._currentReaderCtx = { story, chapter, idx };
  if (window.AUTH?.isOwner && typeof initReaderEditMode === 'function') initReaderEditMode(story, chapter, idx);
}

// ══════════════════════════════════════════════
//  INTERSTITIAL NAVIGATION
// ══════════════════════════════════════════════
function goToChapter(storyId, chapterId) {
  // Use chapter-specific affiliate URL if available, otherwise fall back to config
  let ad = AFFILIATE_ADS[Math.floor(Math.random() * AFFILIATE_ADS.length)];
  if (_storiesCache) {
    const story = _storiesCache.find(s => s.id === storyId);
    const ch    = story?.chapters.find(c => c.id === chapterId);
    if (ch?.affiliateUrl) {
      const domain = (() => { try { return new URL(ch.affiliateUrl).hostname.replace(/^www\./,''); } catch { return ch.affiliateUrl; } })();
      ad = {
        title: "🔗 " + domain,
        desc:  "Ủng hộ tác giả — nhấn vào để ghé thăm trang đối tác!",
        url:   ch.affiliateUrl
      };
    }
  }
  showInterstitial(ad, () => {
    location.href = readerUrl(storyId, chapterId);
  });
}

function showInterstitial(ad, onContinue) {
  const overlay  = document.getElementById("interstitial-overlay");
  const adTitle  = document.getElementById("ad-title");
  const adDesc   = document.getElementById("ad-desc");
  const adLink   = document.getElementById("affiliate-link");
  const numEl    = document.getElementById("countdown-num");
  const skipCnt  = document.getElementById("skip-count");
  const ring     = document.getElementById("countdown-ring");
  const btnSkip  = document.getElementById("btn-skip");
  const btnCont  = document.getElementById("btn-continue");
  if (!overlay) { onContinue(); return; }

  adTitle.textContent = ad.title;
  adDesc.textContent  = ad.desc;
  adLink.href         = ad.url;

  let t = INTERSTITIAL_SECONDS;
  numEl.textContent  = t;
  skipCnt.textContent = t;
  btnSkip.disabled   = true;
  btnCont.disabled   = true;
  ring.style.animation = "cspin 1s linear infinite";
  ring.style.borderTopColor = "var(--primary)";

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";

  const timer = setInterval(() => {
    t--;
    numEl.textContent  = t;
    skipCnt.textContent = t;
    if (t <= 0) {
      clearInterval(timer);
      ring.style.animation = "none";
      ring.style.borderColor = "var(--primary)";
      numEl.textContent = "✓";
      btnSkip.disabled  = false;
      btnCont.disabled  = false;
      btnSkip.innerHTML = "Bỏ qua";
    }
  }, 1000);

  adLink.onclick = e => { e.preventDefault(); window.open(ad.url, "_blank", "noopener"); };

  function close() {
    clearInterval(timer);
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    btnSkip.onclick  = null;
    btnCont.onclick  = null;
  }

  btnSkip.onclick = () => { close(); onContinue(); };
  btnCont.onclick = () => { close(); onContinue(); };
}

// ══════════════════════════════════════════════
//  FOLLOW / BOOKMARK
// ══════════════════════════════════════════════
function isFollowed(id) {
  return JSON.parse(localStorage.getItem("follows") || "[]").includes(id);
}

function toggleFollow(id) {
  let follows = JSON.parse(localStorage.getItem("follows") || "[]");
  const btn = document.getElementById("follow-btn");
  if (follows.includes(id)) {
    follows = follows.filter(x => x !== id);
    if (btn) btn.innerHTML = "🤍 Theo dõi";
  } else {
    follows.push(id);
    if (btn) btn.innerHTML = "❤️ Đang theo dõi";
  }
  localStorage.setItem("follows", JSON.stringify(follows));
}

// ══════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Render chapter content with basic Markdown-lite:
// **text** → <strong>, *text* / _text_ → <em>
// Newlines preserved via CSS white-space:pre-wrap on .reader-body
function renderChapterContent(raw) {
  // 1. Escape HTML entities (XSS-safe)
  let s = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // 2. Bold: **text** (process before single *)
  s = s.replace(/\*\*([^*\r\n]+)\*\*/g, "<strong>$1</strong>");
  // 3. Italic: *text* or _text_ (single line only, no nesting)
  s = s.replace(/\*([^*\r\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_\r\n]+)_/g, "<em>$1</em>");
  return s;
}

function fmtNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n/1000).toFixed(1) + "K";
  return String(n);
}

function errHtml(msg) {
  return `<div class="empty-state"><div class="icon">❌</div><p>${msg}</p></div>`;
}
