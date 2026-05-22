/**
 * Admin Server – Lưu Ly Hiền Nhi Các
 * Port 3344 | Node.js built-in modules only (no npm install needed)
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');
const { exec } = require('child_process');

const PORT         = 3344;
const ROOT         = __dirname;
const STORIES_FILE = path.join(ROOT, 'data', 'stories.json');

// ── Helpers ──────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => b += c.toString());
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  });
  res.end(body);
}

function html(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function staticFile(res, filePath) {
  const ext   = path.extname(filePath).toLowerCase();
  const types = { '.css':'text/css', '.js':'application/javascript',
    '.json':'application/json', '.jpg':'image/jpeg', '.png':'image/png',
    '.gif':'image/gif', '.webp':'image/webp', '.html':'text/html' };
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

// ── Claude API proxy (no fetch, uses built-in https) ─────
function claudeRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const opts = {
      hostname: 'api.anthropic.com', port: 443,
      path: '/v1/messages', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      }
    };
    const req = https.request(opts, r => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => resolve({ status: r.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Request router ────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  if (req.method === 'OPTIONS') { json(res, 204, {}); return; }

  // ── GET /api/stories ──────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/stories') {
    try {
      json(res, 200, fs.readFileSync(STORIES_FILE, 'utf8'));
    } catch(e) { json(res, 500, { error: e.message }); }
    return;
  }

  // ── POST /api/stories  (save) ─────────────────────────
  if (req.method === 'POST' && pathname === '/api/stories') {
    try {
      const body = await readBody(req);
      const stories = JSON.parse(body);          // validates JSON
      fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), 'utf8');
      json(res, 200, { ok: true, count: stories.length });
    } catch(e) { json(res, 400, { error: e.message }); }
    return;
  }

  // ── POST /api/push  (git commit + push) ───────────────
  if (req.method === 'POST' && pathname === '/api/push') {
    try {
      const body   = await readBody(req);
      const { message = 'Admin: cập nhật truyện' } = JSON.parse(body);
      const cmd    = `cd /d "${ROOT}" && git add -A && git commit -m "${message}" && git push`;
      exec(cmd, { shell: 'cmd.exe', timeout: 60000 }, (err, stdout, stderr) => {
        json(res, 200, {
          ok: !err,
          output: (stdout + '\n' + stderr).trim() || (err && err.message) || ''
        });
      });
    } catch(e) { json(res, 500, { error: e.message }); }
    return;
  }

  // ── POST /api/claude  (AI proxy) ──────────────────────
  if (req.method === 'POST' && pathname === '/api/claude') {
    try {
      const body   = await readBody(req);
      const { apiKey, ...payload } = JSON.parse(body);
      if (!apiKey) { json(res, 400, { error: 'API key is required' }); return; }
      const { status, body: rbody } = await claudeRequest(apiKey, payload);
      json(res, status, rbody);
    } catch(e) { json(res, 500, { error: e.message }); }
    return;
  }

  // ── GET / → serve admin.html ──────────────────────────
  if (pathname === '/' || pathname === '/admin' || pathname === '/admin.html') {
    try {
      html(res, 200, fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'));
    } catch(e) { html(res, 500, '<h2>admin.html not found</h2>'); }
    return;
  }

  // ── Static files ──────────────────────────────────────
  const filePath = path.join(ROOT, pathname.replace(/\.\./g, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    staticFile(res, filePath); return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n========================================');
  console.log('  ADMIN PANEL: http://localhost:' + PORT);
  console.log('========================================\n');
});
