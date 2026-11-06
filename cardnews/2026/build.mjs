import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import twitter from 'twitter-text';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const input = path.join(root, 'src', 'DDDSeoul', 'input');
const assets = path.join(root, 'src', 'DDDSeoul', 'theme', 'input');
const cta = 'https://dddseoul.kr/register';
const postHashtags = '#DDDSeoul #DDDSeoul2026';
const expectedHashtags = ['#DDDSeoul', '#DDDSeoul2026'];
const fontDir = path.join(homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Fonts');
const bodyFont = fontkit.openSync(process.env.DDD_FONT_BODY ?? path.join(fontDir, 'Pretendard-Regular.otf'));
const emphasisFont = fontkit.openSync(process.env.DDD_FONT_EMPHASIS ?? path.join(fontDir, 'IBMPlexSansKR-Bold.ttf'));
const eventDate = '2026-12-04';
const channels = ['LinkedIn', 'Facebook', 'X', 'Threads'];
const data = JSON.parse(await readFile(path.join(here, 'content.json'), 'utf8'));
const sources = {};
const sourceHashes = {};
const sha = value => createHash('sha256').update(value).digest('hex');
const escape = text => String(text).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[c]);
const readSource = async relative => {
  const buffer = await readFile(path.join(root, relative));
  sourceHashes[relative.split(path.sep).join('/')] = sha(buffer);
  return buffer.toString('utf8');
};

for (const filename of (await readdir(path.join(input, 'speakers'))).filter(f => f.endsWith('.md'))) {
  const id = path.basename(filename, '.md');
  const relative = path.join('src', 'DDDSeoul', 'input', 'speakers', filename);
  const markdown = await readSource(relative);
  const field = name => markdown.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].replace(/^"|"$/g, '');
  const title = markdown.match(/^### (.+)$/m)?.[1];
  assert(field('Title') && field('SpeakerAffiliation') && field('SpeakerPhoto') && title, filename);
  sources[id] = {
    name: field('Title'), affiliation: field('SpeakerAffiliation'),
    photo: field('SpeakerPhoto'), title, keynote: field('IsKeynote') === 'true',
    pending: title === '키노트 주제는 곧 공개합니다',
    source: relative.split(path.sep).join('/'),
    url: `https://dddseoul.kr/speakers/${id}`,
    ...data.speakers[id]
  };
}
assert.equal(Object.keys(sources).length, 17);
assert.equal(sources.insookkim.title, sources.sohyunbang.title);
const homepage = await readSource(path.join('src', 'DDDSeoul', 'input', 'index.md'));
await readSource(path.join('src', 'DDDSeoul', 'input', 'register.md'));
assert(homepage.includes('datetime="2026-12-04"'), 'Event date changed; review campaign metadata');
assert(homepage.includes('09:00 — 18:00'), 'Event hours changed; review campaign metadata');
assert(homepage.includes('한국 마이크로소프트 13층'), 'Event venue changed; review campaign metadata');
assert(homepage.includes('data-ticket-start="2026-10-10" data-ticket-end="2026-11-09"'), 'First ticket window changed');
assert(homepage.includes('data-ticket-start="2026-11-10" data-ticket-end="2026-12-03"'), 'Second ticket window changed');
for (const [start, price] of [['2026-10-10', '20,000원'], ['2026-11-10', '25,000원']]) {
  const row = homepage.match(new RegExp(`<tr data-ticket-start="${start}"[\\s\\S]*?</tr>`))?.[0];
  assert(row?.includes(price), `Ticket price changed for ${start}; review campaign copy`);
}
for (const [id, partner] of Object.entries(data.partners)) {
  assert(homepage.includes(`/images/sponsors/${partner.logo}`), `Partner source changed: ${id}`);
}
const metadata = {
  name: 'DDD Seoul 2026', date: eventDate, time: '09:00–18:00 KST',
  venue: '한국 마이크로소프트 13층',
  address: '서울특별시 종로구 종로1길 50 더케이트윈타워',
  registration: cta, timezone: 'Asia/Seoul',
  priceNotice: '11/9까지 일반 20,000원, 11/10–12/3 일반 25,000원. 게시 전 실제 판매 안내 재확인.',
  status: '게시 전 검토용 초안. 실제 게시·예약하지 않음.'
};
const dateLabel = date => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;
const typeLabels = {
  attendance: '참가 독려', speaker: '발표자 첫 소개', partner: '파트너사 첫 소개',
  'keynote-recap': '키노트 재소개', 'session-recap': '일반 세션 재소개', 'partner-recap': '파트너사 재소개'
};
const dday = date => (Date.parse(`${eventDate}T00:00:00+09:00`) - Date.parse(`${date}T00:00:00+09:00`)) / 86400000;
const names = ids => ids.map(id => sources[id].name).join('·');
const sessions = ids => {
  const result = [];
  for (const id of ids) {
    const speaker = sources[id];
    const existing = result.find(s => s.title === speaker.title && !speaker.pending);
    if (existing) existing.ids.push(id);
    else result.push({ title: speaker.title, ids: [id] });
  }
  return result;
};
const sessionLines = ids => sessions(ids).map(s => {
  const people = s.ids.map(id => `${sources[id].name}(${sources[id].affiliation})`).join('·');
  return `${people}\n${s.ids[0] === 'youngbinlee' && sources.youngbinlee.pending ? '오프닝 키노트 — 제목 추후 공개' : `「${s.title}」`}`;
}).join('\n\n');

function makeDay(raw) {
  const day = { ...raw, dday: dday(raw.date) };
  day.image = `images/${day.date}.png`;
  day.editable = `editable/${day.date}.svg`;
  const speaker = day.speakers?.[0] ? sources[day.speakers[0]] : undefined;
  const isSpeaker = day.type === 'speaker';
  if (isSpeaker) {
    assert(speaker.hook, `Missing curated copy: ${day.speakers[0]}`);
    day.headline = speaker.pending ? '현장의 AI 전환을\n이끄는 시선' : speaker.short;
    day.deck = names(day.speakers);
    day.lead = speaker.hook;
    day.detail = speaker.takeaway;
    day.facebook = speaker.facebook;
    day.threads = speaker.threads;
    day.x = speaker.x;
  }
  const details = day.speakers ? sessionLines(day.speakers) : '';
  const eventInfo = '2026.12.04(금) 09:00–18:00\n한국 마이크로소프트 13층';
  const register = `참가 등록: ${cta}`;
  day.posts = {
    LinkedIn: [day.lead, day.detail, details, eventInfo, register, postHashtags].filter(Boolean).join('\n\n'),
    Facebook: [day.facebook, day.detail, details, `12월 4일 금요일, 09:00–18:00\n한국 마이크로소프트 13층에서 만나요.`, register, postHashtags].filter(Boolean).join('\n\n'),
    X: `${day.x}\n\n등록: ${cta}\n\n${postHashtags}`,
    Threads: `${day.threads}\n\n12/4(금), 한국 마이크로소프트 13층에서 함께 이야기 나눠요.\n등록: ${cta}\n\n${postHashtags}`
  };
  day.xWeightedLength = twitter.parseTweet(day.posts.X).weightedLength;
  day.threadsLength = Array.from(day.posts.Threads).length;
  const who = day.speakers
    ? sessions(day.speakers).map(s => `${names(s.ids)}: ${sources[s.ids[0]].pending ? '오프닝 키노트, 제목 추후 공개' : s.title}`).join(' / ')
    : day.partners?.map(id => `${data.partners[id].role} ${data.partners[id].name}`).join(', ');
  day.alt = [
    `DDD Seoul 2026. ${day.headline.replace(/\n/g, ' ')}.`,
    who ? `${who}.` : `${day.deck}.`,
    `2026년 12월 4일 금요일 09:00–18:00, 한국 마이크로소프트 13층. 등록: ${cta}`
  ].join(' ');
  day.note ??= speaker?.pending ? '키노트 제목 확정 후 원문과 카드·초안을 함께 갱신.' : '게시 직전 세션·소속·판매 상태를 확인.';
  return day;
}
const campaign = { event: metadata, speakers: sources, partners: data.partners, sourceHashes, days: data.days.map(makeDay) };

function validateCampaign() {
  const { days } = campaign;
  assert.equal(days.length, 32);
  const counts = {};
  const first = new Set();
  const recap = new Set();
  const channelCoverage = Object.fromEntries(channels.map(c => [c, new Set()]));
  const firstDates = [];
  const recapDates = [];
  const recappedSessions = [];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const expected = new Date(Date.UTC(2026, 10, 2 + i)).toISOString().slice(0, 10);
    assert.equal(day.date, expected, 'Missing or duplicate day');
    assert.equal(day.dday, 32 - i);
    counts[day.type] = (counts[day.type] ?? 0) + 1;
    assert(day.dday > 0);
    for (const channel of channels) {
      assert(day.posts[channel].includes(cta), `${day.date}/${channel}: missing CTA`);
      assert.deepEqual(
        day.posts[channel].match(/#[\p{L}\p{N}_]+/gu) ?? [],
        expectedHashtags,
        `${day.date}/${channel}: expected only ${postHashtags}`
      );
      assert(day.posts[channel].trim().length > cta.length);
    }
    assert(twitter.parseTweet(day.posts.X).valid, `X ${day.date}: ${day.xWeightedLength}/280`);
    assert(day.threadsLength <= 500, `Threads ${day.date}: ${day.threadsLength}/500`);
    if (day.type === 'speaker') {
      firstDates.push(day.date);
      day.speakers.forEach(id => {
        assert(!first.has(id), `Duplicate first introduction: ${id}`);
        first.add(id);
      });
    }
    if (day.type === 'keynote-recap' || day.type === 'session-recap') {
      recapDates.push(day.date);
      day.speakers.forEach(id => {
        assert(!recap.has(id), `Duplicate recap: ${id}`);
        recap.add(id);
        for (const channel of channels) {
          assert(day.posts[channel].includes(sources[id].name), `${day.date}/${channel}: ${id} omitted`);
          channelCoverage[channel].add(id);
        }
      });
      if (day.type === 'session-recap') {
        assert(day.speakers.every(id => !sources[id].keynote));
        recappedSessions.push(sessions(day.speakers).length);
      } else {
        assert.deepEqual(day.speakers, ['youngbinlee', 'junghyunnam']);
      }
    }
  }
  assert.deepEqual(counts, { attendance: 3, speaker: 16, partner: 4, 'keynote-recap': 1, 'session-recap': 5, 'partner-recap': 3 });
  assert.deepEqual([...first].sort(), Object.keys(sources).sort());
  assert.deepEqual([...recap].sort(), [...first].sort());
  for (const coverage of Object.values(channelCoverage)) assert.equal(coverage.size, 17);
  assert.equal(firstDates.at(-1), '2026-11-23');
  assert.equal(recapDates[0], '2026-11-24');
  assert(firstDates.at(-1) < recapDates[0]);
  const firstIntroduction = id => days.findIndex(day => day.type === 'speaker' && day.speakers.includes(id));
  assert(firstIntroduction('youngbinlee') > firstIntroduction('minseoksong'), '이영빈 첫 소개는 송민석 첫 소개 이후여야 합니다.');
  assert.deepEqual(recappedSessions, [3, 3, 3, 2, 3]);
  assert.equal(recappedSessions.reduce((a, b) => a + b), 14);
  const joint = days.filter(d => d.type === 'speaker' && d.speakers.includes('insookkim'));
  assert.equal(joint.length, 1);
  assert.deepEqual(joint[0].speakers, ['insookkim', 'sohyunbang']);
  assert.deepEqual(days.filter(d => d.partners?.includes('megazonecloud')).map(d => d.date),
    ['2026-11-10', '2026-11-27', '2026-12-01']);
  assert.equal(new Set(days.filter(d => d.type === 'partner').flatMap(d => d.partners)).size, 4);
  assert(days.find(d => d.date === '2026-11-09').posts.LinkedIn.includes('20,000원'));
  assert(days.find(d => d.date === '2026-11-09').posts.LinkedIn.includes('25,000원'));
}
validateCampaign();

const ink = '#202020', accent = '#BA4609', paper = '#FAF9F6', muted = '#62605C', soft = '#F1E6DB';
let parts = [];
let textRecords = [];
const cache = new Map();
function width(text, size, weight) {
  const font = weight === 700 ? emphasisFont : bodyFont;
  return font.layout(text).positions.reduce((sum, p) => sum + p.xAdvance, 0) / font.unitsPerEm * size;
}
function wrap(text, size, maxWidth, weight) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let remaining = paragraph;
    if (!remaining) { lines.push(''); continue; }
    while (width(remaining, size, weight) > maxWidth) {
      const chars = Array.from(remaining);
      let n = 1;
      while (n < chars.length && width(chars.slice(0, n + 1).join(''), size, weight) <= maxWidth) n++;
      let segment = chars.slice(0, n).join('');
      const space = segment.lastIndexOf(' ');
      if (space > segment.length * 0.55) { segment = segment.slice(0, space); n = Array.from(segment).length; }
      lines.push(segment.trimEnd());
      remaining = chars.slice(n).join('').trimStart();
    }
    lines.push(remaining);
  }
  return lines;
}
function text(value, x, y, maxWidth, size, maxLines = 1, weight = 400, color = ink, minSize = size) {
  let lines;
  while (true) {
    lines = wrap(value, size, maxWidth, weight);
    if (lines.length <= maxLines) break;
    assert(size > minSize, `Text overflow: ${value} (${lines.length}/${maxLines})`);
    size--;
  }
  const font = weight === 700 ? emphasisFont : bodyFont;
  for (const char of value) {
    if (/\s/.test(char)) continue;
    assert(font.hasGlyphForCodePoint(char.codePointAt(0)), `Missing font glyph: ${char}`);
  }
  const height = lines.length * size * 1.34;
  assert(x >= 0 && x + maxWidth <= 1080 && y >= 0 && y + height <= 1080, `Text outside canvas: ${value}`);
  const spans = lines.map((line, i) => `<tspan x="${x}" y="${y + size + i * size * 1.34}">${escape(line)}</tspan>`).join('');
  const fontFamily = weight === 700 ? emphasisFont.familyName : bodyFont.familyName;
  parts.push(`<text font-family="${escape(fontFamily)}" font-size="${size}" font-weight="${weight}" fill="${color}">${spans}</text>`);
  textRecords.push({ value, x, y, width: maxWidth, size, height, lines });
  return height;
}
function rect(x, y, w, h, color, radius = 0) {
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${color}"/>`);
}
async function image(relative, x, y, w, h, portrait = false) {
  const full = path.join(assets, ...relative.replace(/^\//, '').split('/'));
  const key = `${full}:${w}:${h}:${portrait}`;
  if (!cache.has(key)) {
    const original = await readFile(full);
    sourceHashes[path.relative(root, full).split(path.sep).join('/')] = sha(original);
    const buffer = await sharp(original).resize(Math.ceil(w * 1.5), Math.ceil(h * 1.5), {
      fit: portrait ? 'cover' : 'inside', position: 'centre', withoutEnlargement: true
    }).png().toBuffer();
    cache.set(key, buffer.toString('base64'));
  }
  parts.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${portrait ? 'xMidYMid slice' : 'xMidYMid meet'}" href="data:image/png;base64,${cache.get(key)}"/>`);
}
function frame(day) {
  parts = [];
  textRecords = [];
  rect(0, 0, 1080, 1080, paper);
  rect(0, 0, 1080, 12, accent);
  text('DDD Seoul', 64, 46, 700, 38, 1, 700);
  text('2026', 861, 40, 155, 48, 1, 700, accent);
  rect(64, 119, 952, 2, ink);
  const tag = {
    speaker: sources[day.speakers?.[0]]?.keynote ? 'OPENING KEYNOTE' : (day.speakers?.length > 1 ? 'JOINT SESSION' : 'MEET THE SPEAKER'),
    partner: 'WITH OUR PARTNERS', 'partner-recap': 'BETTER TOGETHER',
    'keynote-recap': 'OPENING KEYNOTES / REVISIT', 'session-recap': 'SESSION GUIDE / REVISIT',
    attendance: 'DEVELOPER! DEVELOPER! DEVELOPER!'
  }[day.type];
  text(tag, 64, 140, 790, 18, 1, 700, accent);
  text(`D-${day.dday}`, 910, 136, 106, 24, 1, 700, muted);
}
function footer() {
  for (const record of textRecords) {
    assert(record.y + record.height < 930, `Content overlaps CTA footer: ${record.value}`);
  }
  rect(0, 930, 1080, 150, accent);
  text('2026.12.04 금요일 · 09:00–18:00', 64, 941, 952, 23, 1, 700, '#FFFFFF');
  text('한국 마이크로소프트 13층', 64, 976, 952, 21, 1, 400, '#FFFFFF');
  text(`등록 → ${cta}`, 64, 1013, 952, 30, 1, 700, '#FFFFFF');
}
async function speakerCard(day) {
  const group = day.speakers.map(id => sources[id]);
  const first = group[0];
  if (group.length === 1) {
    rect(76, 222, 390, 390, soft);
    await image(first.photo, 64, 210, 390, 390, true);
    rect(64, 590, 390, 10, accent);
    text(first.name, 492, 219, 524, 56, 1, 700);
    const affiliationHeight = text(first.affiliation, 492, 304, 524, 25, 3, 400, muted);
    text(first.short, 492, Math.max(422, 324 + affiliationHeight), 524, 38, 4, 700, accent, 32);
  } else {
    for (let i = 0; i < 2; i++) {
      const x = 64 + i * 492;
      await image(group[i].photo, x, 203, 210, 210, true);
      text(group[i].name, x + 238, 222, 220, 37, 1, 700);
      text(group[i].affiliation, x + 238, 286, 220, 24, 2, 400, muted);
      text('공동 발표', x + 238, 355, 220, 21, 1, 700, accent);
    }
    rect(64, 449, 952, 122, soft);
    text(first.short, 90, 471, 900, 38, 2, 700, accent, 32);
  }
  text(first.pending ? 'KEYNOTE SPEAKER' : 'SESSION', 64, 635, 952, 19, 1, 700, muted);
  text(first.pending ? '키노트 제목은 추후 공개합니다' : first.title, 64, 677, 952, 40, 5, 700, ink, 30);
}
async function recapCard(day) {
  text(day.headline, 64, 184, 952, 51, 2, 700, ink, 44);
  text(day.deck, 64, 330, 952, 25, 1, 400, accent);
  const rows = sessions(day.speakers);
  const rowHeight = rows.length === 2 ? 247 : 168;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], y = 393 + i * rowHeight;
    rect(64, y, 952, rowHeight - 14, '#FFFFFF', 10);
    rect(64, y, 5, rowHeight - 14, accent);
    const photoSize = row.ids.length === 2 ? 93 : rows.length === 2 ? 160 : 120;
    for (let j = 0; j < row.ids.length; j++) {
      await image(sources[row.ids[j]].photo, 84 + j * 101, y + 17, photoSize, photoSize, true);
    }
    const x = 302;
    text(names(row.ids), x, y + 12, 690, 31, 1, 700);
    const speaker = sources[row.ids[0]];
    const label = day.type === 'keynote-recap'
      ? (speaker.pending ? `${speaker.affiliation}\n키노트 제목 추후 공개` : `${speaker.affiliation}\n${speaker.title}`)
      : speaker.short;
    text(label, x, y + 65, 690, 27, rows.length === 2 ? 4 : 2, 400, muted, 24);
  }
}
async function partnerCard(day) {
  text(day.headline, 64, 184, 952, 52, 2, 700, ink, 45);
  text(day.deck, 64, 331, 952, 25, 1, 700, accent);
  const ids = day.partners;
  for (let i = 0; i < ids.length; i++) {
    const partner = data.partners[ids[i]];
    const y = ids.length === 1 ? 409 : 397 + i * 203;
    const height = ids.length === 1 ? 302 : 179;
    rect(64, y, 952, height, '#FFFFFF', 14);
    await image(`images/sponsors/${partner.logo}`, 125, y + 38, 830, height - 76);
  }
  const message = day.date === '2026-12-01'
    ? '남정현의 오프닝 키노트 · 진미나의 GitHub Copilot\n메가존클라우드 소속 발표자의 경험도 만나보세요.'
    : '개발자가 만들고, 커뮤니티가 함께하는 하루.\n함께해 주셔서 감사합니다.';
  text(message, 64, 792, 952, 28, 3, 400, muted, 25);
}
function attendanceCard(day) {
  text(day.headline, 64, 198, 952, 78, 3, 700, ink, 66);
  text(day.deck, 64, 472, 952, 30, 2, 700, accent, 28);
  rect(64, 588, 952, 290, ink, 14);
  const number = day.date === '2026-11-09' ? '20,000원' : day.date === '2026-12-03' ? 'D-1' : '12.04';
  text(number, 96, 607, 882, 122, 1, 700, '#FFFFFF', 100);
  const label = day.date === '2026-11-09'
    ? '일반 티켓 · 내일 11/10부터 25,000원\n최신 판매 정책은 등록 페이지에서 확인하세요.'
    : day.date === '2026-12-03'
      ? '내일 금요일, 개발자의 경험을 나눠요.\n등록 페이지에서 최신 판매 안내를 확인하세요.'
      : '키노트 2명 + 일반 발표자 15명\nMicrosoft 기술을 중심으로 만나는 커뮤니티';
  text(label, 96, 785, 882, 25, 2, 400, '#FFFFFF', 24);
}
async function svg(day) {
  frame(day);
  if (day.type === 'speaker') await speakerCard(day);
  else if (day.type === 'session-recap' || day.type === 'keynote-recap') await recapCard(day);
  else if (day.partners) await partnerCard(day);
  else attendanceCard(day);
  footer();
  const body = parts.join('\n');
  assert(body.includes(escape(cta)), `SVG CTA missing: ${day.date}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-labelledby="title description">
<title id="title">${escape(day.headline.replace(/\n/g, ' '))}</title>
<desc id="description">${escape(day.alt)}</desc>
${body}
</svg>\n`;
}

async function verifyFiles() {
  const expectedPng = campaign.days.map(d => `${d.date}.png`).sort();
  const expectedSvg = campaign.days.map(d => `${d.date}.svg`).sort();
  const expectedPosts = campaign.days.map(d => `${d.date}.md`).sort();
  assert.deepEqual((await readdir(path.join(here, 'images'))).sort(), expectedPng);
  assert.deepEqual((await readdir(path.join(here, 'editable'))).sort(), expectedSvg);
  assert.deepEqual((await readdir(path.join(here, 'posts'))).sort(), expectedPosts);
  const persisted = JSON.parse(await readFile(path.join(here, 'campaign.json'), 'utf8'));
  assert.deepEqual(persisted.days, campaign.days, 'Run npm run build after changing content or speaker metadata');
  for (const day of campaign.days) {
    const imagePath = path.join(here, day.image);
    const meta = await sharp(imagePath).metadata();
    assert.equal(meta.width, 1080);
    assert.equal(meta.height, 1080);
    assert.equal(meta.format, 'png');
    assert.equal(meta.space, 'srgb');
    const editable = await readFile(path.join(here, day.editable), 'utf8');
    assert.equal(editable, await svg(day), `SVG differs from template: ${day.date}`);
    assert(editable.includes(escape(cta)));
    assert(editable.includes('data:image/png;base64,') || day.type === 'attendance');
    const rendered = await sharp(Buffer.from(editable)).png().toBuffer();
    assert.equal(sha(rendered), sha(await readFile(imagePath)), `PNG is stale: ${day.date}`);
    const posts = await readFile(path.join(here, 'posts', `${day.date}.md`), 'utf8');
    for (const channel of channels) assert(posts.includes(day.posts[channel]), `Stale post ${day.date}/${channel}`);
  }
  for (const [file, hash] of Object.entries(persisted.sourceHashes)) {
    assert.equal(sha(await readFile(path.join(root, ...file.split('/')))), hash, `Source changed: ${file}. Rebuild and review copy.`);
  }
  console.log('PASS: 32 dates, 32 PNGs (1080×1080 sRGB), 32 editable SVGs, 128 CTA-bearing drafts.');
  console.log('PASS: 17 speakers introduced and recapped on all 4 channels; 14 regular sessions + dedicated opening-keynote recap.');
  console.log(`PASS: X max ${Math.max(...campaign.days.map(d => d.xWeightedLength))}/280 weighted; Threads max ${Math.max(...campaign.days.map(d => d.threadsLength))}/500.`);
}

if (process.argv.includes('--check')) {
  await verifyFiles();
} else {
  for (const dir of ['images', 'editable', 'posts']) await mkdir(path.join(here, dir), { recursive: true });
  for (const day of campaign.days) {
    const markup = await svg(day);
    await writeFile(path.join(here, day.editable), markup, 'utf8');
    await sharp(Buffer.from(markup)).png().toFile(path.join(here, day.image));
    const post = [
      `# ${day.date} · ${day.headline.replace(/\n/g, ' ')}`,
      `유형: ${typeLabels[day.type]} · D-${day.dday} · 게시 기준: KST`,
      `![${day.alt}](../${day.image})`,
      `편집 원본: [SVG](../${day.editable})`,
      `## 이미지 대체 텍스트\n\n${day.alt}`,
      ...channels.map(c => `## ${c}${c === 'Threads' ? ' · 개인 계정' : ' · 공식 계정'}\n\n${day.posts[c]}`),
      `## 게시 전 확인\n\n${day.note}\n\nX 가중 문자: ${day.xWeightedLength}/280 · Threads: ${day.threadsLength}/500`,
      '초안입니다. 실제 게시·예약은 하지 않았습니다.'
    ].join('\n\n') + '\n';
    await writeFile(path.join(here, 'posts', `${day.date}.md`), post, 'utf8');
  }
  await writeFile(path.join(here, 'campaign.json'), JSON.stringify(campaign, null, 2) + '\n', 'utf8');
  const calendar = [
    '# DDD Seoul 2026 게시 달력', '',
    '2026년 11월 2일–12월 3일 · KST · 매일 4채널 · 실제 게시 전 검토용', '',
    `모든 이미지·게시글 CTA: ${cta}`, '',
    '| 날짜 | D-day | 유형 | 주제·대상 | 이미지 | 채널별 초안 |',
    '|---|---|---|---|---|---|',
    ...campaign.days.map(d => `| ${dateLabel(d.date)} | D-${d.dday} | ${typeLabels[d.type]} | ${d.deck.replace(/\|/g, '·')} | [PNG](${d.image}) | [4채널](posts/${d.date}.md) |`)
  ].join('\n') + '\n';
  await writeFile(path.join(here, 'calendar.md'), calendar, 'utf8');
  const thumbs = await Promise.all(campaign.days.map(async (d, i) => ({
    input: await sharp(path.join(here, d.image)).resize(270, 270).toBuffer(),
    left: i % 4 * 270, top: Math.floor(i / 4) * 270
  })));
  await sharp({ create: { width: 1080, height: 2160, channels: 3, background: paper } }).composite(thumbs).png().toFile(path.join(here, 'contact-sheet.png'));
  await verifyFiles();
}
