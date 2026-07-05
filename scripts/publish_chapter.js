// Tự động xuất bản chương truyện từ kho chờ (data/queue/) vào data/stories.json.
// Chạy bởi GitHub Actions mỗi ngày. Lấy file có tên nhỏ nhất (theo thứ tự ngày),
// nối chương vào đúng truyện, rồi xóa file khỏi kho chờ.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QUEUE_DIR = path.join(ROOT, 'data', 'queue');
const STORIES = path.join(ROOT, 'data', 'stories.json');

if (!fs.existsSync(QUEUE_DIR)) {
  console.log('Khong co thu muc queue — bo qua.');
  process.exit(0);
}

const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json')).sort();
if (!files.length) {
  console.log('Kho cho trong — khong co chuong de dang.');
  process.exit(0);
}

const file = files[0];
const item = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8'));
const stories = JSON.parse(fs.readFileSync(STORIES, 'utf8'));

const story = stories.find(s => s.id === item.storyId);
if (!story) {
  console.error('KHONG TIM THAY TRUYEN: ' + item.storyId);
  process.exit(1);
}
if (story.chapters.some(c => String(c.id) === String(item.chapter.id))) {
  console.log('Chuong ' + item.chapter.id + ' da ton tai — xoa khoi queue.');
  fs.unlinkSync(path.join(QUEUE_DIR, file));
  process.exit(0);
}

story.chapters.push(item.chapter);
fs.writeFileSync(STORIES, JSON.stringify(stories, null, 2), 'utf8');
fs.unlinkSync(path.join(QUEUE_DIR, file));

// Xuất thông tin cho bước Telegram
const summary = story.title + ' — ' + item.chapter.title;
fs.writeFileSync(path.join(ROOT, 'published.txt'), summary, 'utf8');
console.log('DA DANG: ' + summary);
console.log('Con lai trong kho cho: ' + (files.length - 1) + ' chuong.');
