import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { websiteContent, websiteActions } from '../src/data/websiteContent.mjs';

const decode = (text) => text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const plain = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
for (const [key, page] of Object.entries(websiteContent)) {
  const filename = `.next/server/pages/${page.path === '/' ? 'index' : page.path.slice(1)}.html`;
  const html = await readFile(filename, 'utf8');
  const text = plain(html);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${page.path}: expected one main heading`);
  for (const value of [page.title, ...(key === 'vendors' ? [] : [page.subtitle]), ...(key === 'home' ? page.intro.slice(1) : page.intro)]) assert.ok(text.includes(normalize(value)), `${page.path}: missing ${value}`);
  for (const section of page.sections) {
    assert.ok(text.includes(key === 'home' && section.title === 'Explore Our Categories' ? 'Discover Your Wedding Essentials' : section.title), `${page.path}: missing section ${section.title}`);
    if (key === 'contact') continue;
    for (const paragraph of section.paragraphs) for (const value of paragraph.split(';')) assert.ok(text.includes(normalize(value)), `${page.path}: missing paragraph ${value}`);
  }
  for (const action of websiteActions(key)) assert.ok(text.includes(action.label), `${page.path}: missing action ${action.label}`);
  assert.ok(html.includes('<meta name="description"'), `${page.path}: missing description`);
  assert.ok(decode(html).includes(page.seoTitle), `${page.path}: missing SEO title`);
  assert.ok(!/dummy|\[Insert verified|SEO Metadata \(Proposed\)/i.test(text), `${page.path}: editorial/demo text was published`);
  await access(`public${page.image}`);
  console.log(`PASS ${page.path}: heading, sections, actions and metadata`);
}
console.log('All 13 document pages passed content checks.');
