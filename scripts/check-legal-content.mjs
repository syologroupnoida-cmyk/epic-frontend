import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { legalContent } from '../src/data/legalContent.mjs';

const decode = (text) => text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
let sections = 0;
for (const page of Object.values(legalContent)) {
  const html = await readFile(`.next/server/pages${page.path}.html`, 'utf8');
  const text = normalize(decode(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.ok(text.includes(page.title));
  assert.ok(html.includes(`aria-label="${decode(page.title).replaceAll('&', '&amp;')} contents"`));
  for (const section of page.sections) {
    assert.ok(text.includes(section.title));
    assert.ok(html.includes(`id="${section.id}"`));
    assert.ok(html.includes(`href="#${section.id}"`));
    for (const paragraph of section.paragraphs) assert.ok(text.includes(normalize(paragraph)), `${page.path}: changed or missing paragraph under ${section.title}`);
    sections++;
  }
  await access(`public${page.image}`);
  assert.ok(html.includes(encodeURIComponent(page.image)), `${page.path}: missing banner background`);
  assert.ok(html.includes('<meta name="description"'));
  assert.ok(html.includes(`href="${page.path}"`));
  console.log(`PASS ${page.path}: all ${page.sections.length} clauses and contents links`);
}
console.log(`All ${sections} supplied legal sections passed content checks.`);
