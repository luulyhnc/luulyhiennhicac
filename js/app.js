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
        const fx    = s.logoEffect || 'normal';
        if (fx === 'bold')     { el.style.fontWeight = '900'; }
        else if (fx === 'italic')  { el.style.fontStyle = 'italic'; }
        else if (fx === 'bold-i')  { el.style.fontWeight = '900'; el.style.fontStyle = 'italic'; }
        else if (fx === '3d')      { el.style.textShadow = `2px 2px 0 rgba(0,0,0,.22),4px 4px 0 rgba(0,0,0,.1)`; }
        else if (fx === 'gradient') {
          el.style.background = `linear-gradient(135deg,${color} 0%,#e74c8b 50%,${color} 100%)`;
          el.style.webkitBackgroundClip = 'text'; el.style.webkitTextFillColor = 'transparent';
          el.style.backgroundClip = 'text';
        }
        else if (fx === 'anim') {
          el.style.background = `linear-gradient(90deg,${color},#e74c8b,#8e44ad,${color})`;
          el.style.backgroundSize = '300%';
          el.style.webkitBackgroundClip = 'text'; el.style.webkitTextFillColor = 'transparent';
          el.style.backgroundClip = 'text'; el.style.animation = 'logo-shimmer 3s linear infinite';
        }
        else if (fx === 'typing') {
          el.style.overflow = 'hidden'; el.style.borderRight = `2px solid ${color}`;
          el.style.whiteSpace = 'nowrap'; el.style.display = 'inline-block';
          el.style.animation = 'logo-typing 3.5s steps(20) infinite';
        }
      });

      // Background image
      if (s.bgImage) {
        const dim    = (s.bgDim !== undefined ? s.bgDim : 30);
        const overlay = `rgba(0,0,0,${(dim/100).toFixed(2)})`;
        const bg     = `${overlay}, url('${s.bgImage}') center/cover no-repeat`;
        const target = s.bgTarget || 'hero';
        if (target === 'body') {
          document.body.style.backgroundImage = `url('${s.bgImage}')`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundAttachment = 'fixed';
        } else if (target === 'header') {
          document.querySelectorAll('header').forEach(h => {
            h.style.backgroundImage = `url('${s.bgImage}')`; h.style.backgroundSize = 'cover';
          });
        } else {
          const hero = document.querySelector('.hero-banner');
          if (hero) { hero.style.background = bg; }
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
//  DATA
// ══════════════════════════════════════════════
let _storiesCache = null;
let _seriesCache  = null;

async function fetchStories() {
  if (_storiesCache) return _storiesCache;
  const res = await fetch("data/stories.json");
  _storiesCache = await res.json();
  return _storiesCache;
}

async function fetchSeries() {
  if (_seriesCache) return _seriesCache;
  try {
    const res = await fetch("data/series.json");
    _seriesCache = await res.json();
  } catch { _seriesCache = []; }
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

  // Render hero & sidebar with visible list
  renderHero(allVisible[0], allVisible);
  renderSidebar(allVisible);

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

  listEl.innerHTML = stories.map(s => storyCardH(s)).join("");
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

function renderSidebar(stories) {
  const hotList   = document.getElementById("hot-list");
  const trendTags = document.getElementById("trend-tags");

  if (hotList) {
    const sorted = [...stories].sort((a, b) => (b.views || 0) - (a.views || 0));
    hotList.innerHTML = sorted.map((s, i) => `
      <a class="hot-item" href="${storyUrl(s.id)}">
        <span class="hot-rank ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</span>
        ${s.cover
          ? `<img src="${s.cover}" alt="${s.title}" class="hot-cover">`
          : `<div class="hot-cover-ph">📚</div>`}
        <div class="hot-info">
          <div class="hot-title">${s.title}</div>
          <div class="hot-meta">⭐${s.rating||4.5} · 👁 ${fmtNum(s.views||0)}</div>
        </div>
      </a>`).join("");
  }

  if (trendTags) {
    const genres = [...new Set(stories.flatMap(s => s.genre))];
    const list   = genres.length ? genres
      : ["Tiên Hiệp","Huyền Huyễn","Ngôn Tình","Đô Thị","Nữ Cường","Kiếm Hiệp","Lịch Sử","Tu Tiên","Hành Động"];
    trendTags.innerHTML = list.map(g =>
      `<a class="trend-tag" href="index.html?genre=${encodeURIComponent(g)}">${g}</a>`
    ).join("");
  }
}

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

  root.innerHTML = `
    ${navBtns(false)}
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
