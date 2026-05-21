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
//  DATA
// ══════════════════════════════════════════════
let _storiesCache = null;

async function fetchStories() {
  if (_storiesCache) return _storiesCache;
  const res = await fetch("data/stories.json");
  _storiesCache = await res.json();
  return _storiesCache;
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
  const grid    = document.getElementById("story-grid");
  const heading = document.getElementById("section-heading");
  const stats   = document.getElementById("hero-stats");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";
  const genre  = params.get("genre")  || "";
  const status = params.get("status") || "";

  let stories = await fetchStories();

  // Stats banner
  if (stats) {
    stats.innerHTML = `
      <div class="hero-stat"><div class="num">${stories.length}</div><div class="lbl">Truyện</div></div>
      <div class="hero-stat"><div class="num">${stories.reduce((a,s) => a + s.chapters.length, 0)}</div><div class="lbl">Chương</div></div>
      <div class="hero-stat"><div class="num">${stories.filter(s=>s.status==="Hoàn thành").length}</div><div class="lbl">Hoàn thành</div></div>
    `;
  }

  // Filtering
  if (search) {
    stories = stories.filter(s =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase())
    );
    if (heading) heading.textContent = `🔍 Kết quả: "${search}"`;
  } else if (genre) {
    stories = stories.filter(s => s.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    if (heading) heading.textContent = "📂 Thể loại: " + genre;
  } else if (status) {
    stories = stories.filter(s => s.status.toLowerCase() === status.toLowerCase());
    if (heading) heading.textContent = "📋 " + status;
  }

  if (!stories.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">😢</div><p>Không tìm thấy truyện phù hợp.</p></div>`;
    return;
  }

  grid.innerHTML = stories.map(s => `
    <div class="story-card" onclick="location.href='${storyUrl(s.id)}'">
      <div class="thumb">
        <img src="${s.cover}" alt="${s.title}" loading="lazy">
        <span class="status-badge ${s.status === "Hoàn thành" ? "badge-done" : "badge-ongoing"}">${s.status}</span>
      </div>
      <div class="info">
        <div class="title">${s.title}</div>
        <div class="meta">${s.author}</div>
        <div class="chap-count">📖 ${s.chapters.length} chương</div>
      </div>
    </div>
  `).join("");
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

  document.title = story.title + " – TruyệnHub";
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
          <tr><td>Trạng thái</td><td><span style="color:${story.status==="Hoàn thành"?"var(--green)":"var(--accent)"}">${story.status}</span></td></tr>
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

  document.title = chapter.title + " – " + story.title + " – TruyệnHub";

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
    <div class="reader-body" id="chapter-body">${escHtml(chapter.content)}</div>
    ${navBtns(true)}
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ══════════════════════════════════════════════
//  INTERSTITIAL NAVIGATION
// ══════════════════════════════════════════════
function goToChapter(storyId, chapterId) {
  const ad = AFFILIATE_ADS[Math.floor(Math.random() * AFFILIATE_ADS.length)];
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
  ring.style.borderTopColor = "var(--accent)";

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";

  const timer = setInterval(() => {
    t--;
    numEl.textContent  = t;
    skipCnt.textContent = t;
    if (t <= 0) {
      clearInterval(timer);
      ring.style.animation = "none";
      ring.style.borderColor = "var(--accent)";
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

function fmtNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n/1000).toFixed(1) + "K";
  return String(n);
}

function errHtml(msg) {
  return `<div class="empty-state"><div class="icon">❌</div><p>${msg}</p></div>`;
}
