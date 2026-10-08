import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const terms = read('../terms.html');
const privacy = read('../privacy.html');
const css = read('../assets/css/styles.css');
const js = read('../assets/js/main.js');
const sitemap = read('../sitemap.xml');
const robots = read('../robots.txt');
const productionOrigin = 'https://mintmetal.alexiasoft.co/';
for (const [pageName, page, path] of [
  ['Home', html, ''],
  ['Privacy', privacy, 'privacy.html'],
  ['Terms', terms, 'terms.html'],
]) {
  const expectedUrl = productionOrigin + path;
  const canonical = [...page.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonical.length, 1, pageName + ' has one canonical');
  assert.equal(canonical[0][1], expectedUrl, pageName + ' canonical URL');
  assert.equal(page.match(/<meta property="og:url" content="([^"]+)"/)?.[1], expectedUrl, pageName + ' Open Graph URL');
  const title = page.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = page.match(/<meta name="description"\s+content="([^"]+)"/)?.[1];
  assert.equal(page.match(/<meta property="og:title" content="([^"]+)"/)?.[1], title, pageName + ' Open Graph title');
  assert.equal(page.match(/<meta property="og:description"\s+content="([^"]+)"/)?.[1], description, pageName + ' Open Graph description');
  assert.equal(page.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1], title, pageName + ' Twitter title');
  assert.ok(page.match(/<meta name="twitter:description"\s+content="([^"]+)"/)?.[1], pageName + ' Twitter description');
  assert.doesNotMatch(page, /minthrm\.alexiasoft\.co/i, pageName + ' has no legacy domain');
  for (const [, asset] of page.matchAll(/(?:src|href)="(assets\/[^"?#]+)/g)) {
    assert.ok(existsSync(new URL('../' + asset, import.meta.url)), pageName + ' asset exists: ' + asset);
  }
  for (const [, link] of page.matchAll(/href="((?:index|privacy|terms)\.html)(?:#[^"]*)?"/g)) {
    assert.ok(existsSync(new URL('../' + link, import.meta.url)), pageName + ' internal link resolves: ' + link);
  }
}
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc), [
  productionOrigin,
  productionOrigin + 'privacy.html',
  productionOrigin + 'terms.html',
], 'sitemap lists exactly the three public pages');
assert.doesNotMatch(robots + sitemap, /minthrm\.alexiasoft\.co/i, 'crawl files have no legacy domain');
const pricing = html.match(/<section[^>]*id="pricing"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
const table = pricing.match(/<table class="hrm-comparison">[\s\S]*?<\/table>/)?.[0] ?? '';
const faq = html.match(/<section[^>]*id="faq"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs are unique');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `#${target} resolves`);
for (const [, asset] of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)/g)) {
  assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `${asset} exists`);
}
assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
assert.match(html, /rel="canonical"/);
assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1, 'homepage has one canonical');
assert.match(html, /<title>MINT METAL \| ERP สำหรับธุรกิจและโรงงานเมทัลชีท<\/title>/, 'homepage title identifies MINT METAL');
assert.match(html, /<meta name="description"\s+content="[^"]+"\s*\/>/, 'homepage description exists');
assert.match(html, /<meta property="og:title"\s+content="[^"]+"\s*\/>/);
assert.match(html, /<meta property="og:description"\s+content="[^"]+"\s*\/>/);
assert.match(html, /<meta property="og:type" content="website"\s*\/>/);
assert.match(html, /<meta property="og:locale" content="th_TH"\s*\/>/);
assert.match(html, /<meta property="og:url" content="https:\/\/mintmetal\.alexiasoft\.co\/"\s*\/>/);
assert.match(html, /<meta name="twitter:card" content="summary"\s*\/>/);
assert.match(html, /<meta name="twitter:title" content="[^"]+"\s*\/>/);
assert.match(html, /<meta name="twitter:description"\s+content="[^"]+"\s*\/>/);
assert.match(html, /<meta name="description"\s+content="MINT METAL ERP[^\"]*"\s*\/>/);
assert.match(html, /<meta property="og:title"\s+content="MINT METAL[^\"]*"\s*\/>/);
assert.match(html, /<meta name="twitter:title"\s+content="MINT METAL[^\"]*"\s*\/>/);
assert.match(html, /src="assets\/images\/mintmetal-logo\.png" alt="MINT METAL"/);
const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(([, block]) => JSON.parse(block));
assert.ok(jsonLdBlocks.length > 0, 'JSON-LD exists and parses');
const schemaTypes = jsonLdBlocks.flatMap((block) => block['@graph']?.map((entity) => entity['@type']) ?? [block['@type']]);
assert.ok(['Organization', 'WebSite', 'SoftwareApplication'].every((type) => schemaTypes.includes(type)));
const softwareSchema = jsonLdBlocks.flatMap((block) => block['@graph'] ?? []).find((entity) => entity['@type'] === 'SoftwareApplication');
assert.equal(softwareSchema?.name, 'MINT METAL');
assert.match(softwareSchema?.description ?? '', /^MINT METAL ERP/);
const websiteSchema = jsonLdBlocks.flatMap((block) => block['@graph'] ?? []).find((entity) => entity['@type'] === 'WebSite');
assert.equal(websiteSchema?.['@id'], `${productionOrigin}#website`);
assert.equal(websiteSchema?.url, productionOrigin);
assert.equal(softwareSchema?.url, productionOrigin);
assert.ok(schemaTypes.includes('FAQPage'), 'visible FAQ has structured data');
const faqSchema = jsonLdBlocks.find((block) => block['@type'] === 'FAQPage');
const visibleFaq = [...faq.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map(([, details]) => {
  const question = details.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';
  const answer = details.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';
  return [question.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/\+$/, '').trim(), answer.replace(/\s+/g, ' ').trim()];
});
const structuredFaq = faqSchema.mainEntity.map(({ name, acceptedAnswer }) => [name, acceptedAnswer.text]);
assert.equal(visibleFaq.length, 6, 'FAQ has six visible questions');
assert.equal(faqSchema.mainEntity.length, 6, 'FAQ schema has six questions');
assert.deepEqual(structuredFaq, visibleFaq, 'FAQ structured data matches visible question and answer text');
assert.equal(structuredFaq[0][1], 'Subscription เลือกชำระรายเดือนหรือรายปีได้ โดยแพ็กเกจรายปีประหยัดเทียบเท่า 2 เดือน รวม Cloud Hosting, Backup, MA และ Support ตามขอบเขตบริการ ส่วน License เป็นการซื้อสิทธิ์ใช้งานตามสัญญา ไม่รวม Hosting / Server / Infrastructure โดยรวม MA ปีแรก และเริ่มคิด MA ตั้งแต่ปีที่ 2 ตามข้อตกลงบริการ');
assert.match(css, /\.faq-list summary:focus-visible\s*\{[^}]*outline:\s*3px solid #0b8064/i, 'FAQ has a visible theme-colored keyboard focus outline');
const faqDetails = [...faq.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)];
const faqIds = faqDetails.map(([, attrs]) => attrs.match(/\bid="([^"]+)"/)?.[1]);
const faqAnswerIds = faqDetails.map(([, , body]) => body.match(/<div\b[^>]*\bid="([^"]+)"/)?.[1]);
const faqControls = faqDetails.map(([, , body]) => body.match(/<summary\b[^>]*\baria-controls="([^"]+)"/)?.[1]);
assert.ok(faqIds.every(Boolean) && new Set(faqIds).size === 6, 'FAQ details have unique IDs');
assert.ok(faqAnswerIds.every(Boolean) && new Set(faqAnswerIds).size === 6, 'FAQ answers have unique IDs');
assert.deepEqual(faqControls, faqAnswerIds, 'FAQ summaries control their answer content');
assert.doesNotMatch(JSON.stringify(faqSchema), /MintHRM|MINT HRM|HRM|Payroll|Attendance|Leave/i, 'FAQ schema has no old HRM content');
const visibleBody = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ');
assert.doesNotMatch(visibleBody, /MintHRM|MINT HRM|\bHRM\b|Payroll|Attendance|Employee/i, 'visible homepage copy has no old HRM branding');
assert.equal((pricing.match(/pricing-group-heading/g) ?? []).length, 2, 'pricing has Subscription and License group headings');
assert.deepEqual([...pricing.matchAll(/<span class="pricing-heading-badge">([^<]+)<\/span>/g)].map(([, label]) => label), ['Cloud Hosting', 'Project Scope'], 'pricing panels show the approved badges');
assert.ok(pricing.includes('ใช้งานระบบ ERP สำหรับธุรกิจเหล็กและเมทัลชีทผ่าน Cloud Hosting ที่ดูแลโดย AlexiaSoft พร้อมสำรองข้อมูล อัปเดตระบบมาตรฐาน และ Support ในวัน/เวลาทำการ'));
assert.ok(pricing.includes('ซื้อสิทธิ์ใช้งาน MINT METAL ตามสัญญา ติดตั้งบนโครงสร้างพื้นฐานที่ตกลงร่วมกัน และประเมินงานปรับแต่งตามขอบเขตโครงการ'));
assert.ok(pricing.includes('ค่าติดตั้งแยกต่างหาก · รวม Cloud Hosting, Backup, MA และ Support ตามขอบเขตบริการ'));
assert.ok(pricing.includes('ค่าติดตั้งและตั้งค่าระบบคิดแยกตามแพ็กเกจ · ไม่รวม Hosting / Server / Infrastructure · รวม MA ปีแรก และเริ่มคิดค่าบำรุงรักษาระบบตั้งแต่ปีที่ 2 ตามข้อตกลงบริการ · Support ตามขอบเขตบริการ'));
assert.doesNotMatch(html, /AggregateRating|reviewCount|ratingValue|"@type"\s*:\s*"Review"/i, 'no fabricated ratings or reviews');
assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'exactly one homepage H1');
assert.doesNotMatch(html, /(?:hidden-seo|keyword-block|seo-keywords)/i, 'no hidden keyword block');
const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
assert.ok(images.length > 0 && images.every((image) => /\balt="[^"]+"/.test(image)), 'homepage images have useful alt text');
assert.match(robots, /^User-agent:\s*\*\s*\r?\nAllow:\s*\/\s*$/m, 'robots allows crawling');
assert.match(robots, /Sitemap:\s*https:\/\/mintmetal\.alexiasoft\.co\/sitemap\.xml/);
assert.match(robots, /Allow:\s*\//);
assert.match(sitemap, /<loc>https:\/\/mintmetal\.alexiasoft\.co\/<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/mintmetal\.alexiasoft\.co\/privacy\.html<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/mintmetal\.alexiasoft\.co\/terms\.html<\/loc>/);
assert.doesNotMatch(sitemap, /#/);
assert.match(privacy, /<title>นโยบายคุ้มครองข้อมูลส่วนบุคคล \| MINT METAL<\/title>/);
assert.match(privacy, /<meta name="description"\s+content="[^"]+"\s*\/>/);
assert.match(privacy, /<link rel="canonical" href="https:\/\/mintmetal\.alexiasoft\.co\/privacy\.html"\s*\/>/);
const overviewSection = html.match(/<section class="owner-section">[\s\S]*?<\/section>/)?.[0] ?? '';
const mockupSection = html.match(/<section class="section section-shell screens-section" id="screens">[\s\S]*?<\/section>/)?.[0] ?? '';
const gettingStartedSection = html.match(/<section class="section getting-started" id="getting-started">[\s\S]*?<\/section>/)?.[0] ?? '';
const contactSection = html.match(/<section class="contact-section" id="contact">[\s\S]*?<\/section>/)?.[0] ?? '';
assert.match(overviewSection, /MINT METAL OVERVIEW/);
assert.match(overviewSection, /Sales Overview[\s\S]*Purchase Status[\s\S]*Inventory Status[\s\S]*Production & Delivery Status/);
assert.equal([...overviewSection.matchAll(/class="owner-panel"/g)].length, 4, 'overview retains four existing panels');
for (const label of ['ตัวอย่างหน้าจอระบบ', 'ภาพรวมการใช้งาน MINT METAL', 'เลือกโปรแกรม', 'POS', 'Purchase', 'INV', 'CRM', 'Logistic App', 'Factory App', 'Maintenance', 'Internal Assign', 'Dashboard ประจำวัน / เดือน', '128,450', '84,200', '214,800', '12,500', '6,200', 'ขอนแก่น', 'หนองเรือ', 'พิษณุโลก', 'สกลนคร', 'อุตรดิตถ์', 'บุรีรัมย์', 'ชัยภูมิ', 'มหาสารคาม', '3,090', '2,565']) assert.ok(mockupSection.includes(label), `mockup includes ${label}`);
assert.equal([...mockupSection.matchAll(/<figure class="screen-card reveal">/g)].length, 4, 'four mockup cards remain');
const homepageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
assert.equal(new Set(homepageIds).size, homepageIds.length, 'homepage IDs are unique');
assert.match(gettingStartedSection, /กระบวนการจริง/);
assert.match(contactSection, /MINT METAL/);
assert.match(contactSection, /<h2>พร้อมเชื่อมทุกขั้นตอนของโรงงาน<br>ไว้ในระบบเดียวแล้วหรือยัง\?<\/h2>/, 'CTA heading remains complete');
assert.match(contactSection, />ขอ Demo/);
assert.match(contactSection, /href="tel:\+66616975959"/);
assert.match(html, /<p>MINT METAL ERP สำหรับธุรกิจและโรงงาน Metal Sheet<\/p>/);
for (const section of [overviewSection, mockupSection, gettingStartedSection, faq, contactSection]) { const visibleCopy = section.replace(/<[^>]*>/g, ' '); assert.doesNotMatch(visibleCopy, /MintHRM|MINT HRM|\\bHRM\\b|\\bHR\\b|Employee|Payroll|Attendance|Leave|Work Time|Payslip|พนักงาน|เงินเดือน|ลงเวลา|การลา/i); }
assert.match(terms, /<title>ข้อกำหนดและเงื่อนไข \| MINT METAL<\/title>/);
assert.match(terms, /<meta name="description"\s+content="[^"]+"\s*\/>/);
for (const [pageName, page, expectedPath, expectedTitle] of [
  ['Privacy', privacy, 'privacy.html', 'นโยบายคุ้มครองข้อมูลส่วนบุคคล | MINT METAL'],
  ['Terms', terms, 'terms.html', 'ข้อกำหนดและเงื่อนไข | MINT METAL'],
]) {
  const pageIds = [...page.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(pageIds).size, pageIds.length, `${pageName} IDs are unique`);
  assert.match(page, new RegExp(`<img src="assets/images/mintmetal-logo\\.png" alt="MINT METAL"`), `${pageName} uses the MINT METAL logo`);
  assert.match(page, /aria-label="MINT METAL หน้าแรก"/, `${pageName} logo has MINT METAL accessibility label`);
  assert.match(page, new RegExp(`<title>${expectedTitle}<\\/title>`), `${pageName} title uses MINT METAL branding`);
  const pageDescription = page.match(/<meta name="description"\s+content="([^"]+)"\s*\/>/)?.[1] ?? '';
  assert.match(pageDescription, /MINT METAL/, `${pageName} description uses MINT METAL branding`);
  assert.match(page, new RegExp(`href="https:\\/\\/mintmetal\\.alexiasoft\\.co\\/${expectedPath}"`), `${pageName} uses the production canonical URL`);
  const visibleLegalCopy = (page.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? page).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ');
  assert.doesNotMatch(visibleLegalCopy, /MintHRM|MINT HRM|\bHRM\b|Payroll|Attendance|Employee|Leave|Work Time/i, `${pageName} has no visible HRM copy`);
}
assert.match(html, /<footer class="site-footer">/);
assert.ok(existsSync(new URL('../privacy.html', import.meta.url)));
assert.ok(existsSync(new URL('../terms.html', import.meta.url)), 'terms page exists');
assert.match(html, /<a href="privacy\.html"[^>]*>[^<]*<\/a>/, 'Privacy link remains in main footer');
assert.match(html, /<a href="terms\.html"[^>]*>[^<]*<\/a>/, 'main footer links Terms');
const footerPages = [html, privacy, terms];
const footerMarkup = footerPages.map((page) => page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1] ?? '');
assert.ok(footerMarkup.every(Boolean), 'all pages have a footer');
const footerLinks = footerMarkup.map((footer) => footer.match(/<div class="footer-links">([\s\S]*?)<\/div>/)?.[1] ?? '');
const footerContact = footerMarkup.map((footer) => footer.match(/<div class="footer-contact">([\s\S]*?)<\/div>/)?.[1] ?? '');
assert.ok(footerLinks.every((links) => links && !/AlexiaSoft ↗/.test(links)), 'AlexiaSoft site link is absent from middle navigation');
assert.ok(footerContact.every((contact) => [...contact.matchAll(/href="https:\/\/alexiasoft\.co\//g)].length === 1), 'AlexiaSoft site link appears once in each contact column');
assert.ok(footerPages.every((page) => [...page.matchAll(/เว็บไซต์ AlexiaSoft ↗/g)].length === 1));
assert.ok(footerLinks.every((links) => /href="privacy\.html"/.test(links) && /href="terms\.html"/.test(links)), 'Privacy and Terms remain in middle navigation');
const normalizedNavHrefs = footerLinks.map((links) => [...links.matchAll(/href="([^"]+)"/g)].map(([, href]) => href.replace(/^index\.html/, '')));
assert.deepEqual(normalizedNavHrefs[1], normalizedNavHrefs[0], 'Privacy footer navigation order matches index');
assert.deepEqual(normalizedNavHrefs[2], normalizedNavHrefs[0], 'Terms footer navigation order matches index');
const contactHrefs = footerContact.map((contact) => [...contact.matchAll(/href="([^"]+)"/g)].map(([, href]) => href));
assert.deepEqual(contactHrefs[0], ['mailto:sale@alexiasoft.co', 'tel:+66616975959', 'https://alexiasoft.co/']);
assert.deepEqual(contactHrefs[1], contactHrefs[0], 'Privacy footer contact order matches index');
assert.deepEqual(contactHrefs[2], contactHrefs[0], 'Terms footer contact order matches index');
for (const footer of footerMarkup) {
  for (const [, href] of footer.matchAll(/href="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;
    const [path, fragment] = href.split('#');
    const targetPath = path || 'index.html';
    assert.ok(existsSync(new URL(`../${targetPath}`, import.meta.url)), `footer target ${targetPath} exists`);
    if (fragment) assert.ok(ids.includes(fragment), `footer fragment #${fragment} resolves`);
  }
}
assert.match(css, /\.footer-links,\s*\.footer-contact\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/);
assert.match(css, /@media \(max-width: 390px\)[\s\S]*?\.footer-main\s*\{\s*grid-template-columns:\s*1fr/);
assert.doesNotMatch(html, /<form\b|\/api\/contact\.php|data-sitekey/i);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|leadForm/);

assert.ok(pricing, '#pricing exists');
assert.match(pricing, /class="pricing-intro/);
assert.match(pricing, /เหมาะสำหรับโรงงานที่ต้องการเชื่อมงานหลักและงานปฏิบัติการในระบบเดียว/);
assert.match(pricing, /เหมาะสำหรับโรงงานที่ต้องการเชื่อมงานหลักและงานปฏิบัติการในระบบเดียว/);
assert.match(pricing, /เลือกรูปแบบ MINT METAL ที่เหมาะกับโรงงานของคุณ/);
assert.match(pricing, /class="pricing-plan-grid pricing-plan-grid--packages"/);
const packageCards = [...pricing.matchAll(/<article class="pricing-plan[^>]*>([\s\S]*?)<\/article>/g)].map(([, card]) => card);
assert.equal(packageCards.length, 4, 'two packages for each buying model');
assert.equal((pricing.match(/pricing-billing-block/g) ?? []).length, 2, 'two billing model blocks');
const billingBlocks = [...pricing.matchAll(/<div class="pricing-billing-block[^"]*">([\s\S]*?)(?=<div class="pricing-billing-block[^"]*">|<div class="pricing-comparison-intro pricing-module-intro">)/g)].map(([, block]) => block);
assert.equal(billingBlocks.length, 2);
for (const block of billingBlocks) assert.equal([...block.matchAll(/<article class="pricing-plan/g)].length, 2, 'each billing block has two package cards');
assert.match(css, /pricing-billing-grid[\s\S]*grid-template-columns:\s*repeat\(2/);
assert.match(css, /@media \(max-width: 1100px\)[\s\S]*pricing-billing-grid \{ grid-template-columns: 1fr/);
assert.match(pricing, /pricing-billing-grid/);
assert.equal([...pricing.matchAll(/class="pricing-billing-block pricing-parent-panel"/g)].length, 2, 'two framed parent pricing panels');
assert.match(pricing, /<p class="pricing-model-label">HOSTED[^<]*<\/p>\s*<h3>Subscription<\/h3>/);
assert.match(pricing, /<p class="pricing-model-label">LICENSE[^<]*<\/p>\s*<h3>License \+ Customize<\/h3>/);
const parentPanels = [...pricing.matchAll(/<div class="pricing-billing-block pricing-parent-panel">([\s\S]*?)(?=<div class="pricing-billing-block pricing-parent-panel">|<div class="pricing-comparison-intro pricing-module-intro">)/g)].map(([, panel]) => panel);
assert.equal(parentPanels.length, 2, 'both buying models have a parent panel');
for (const panel of parentPanels) {
  assert.equal([...panel.matchAll(/<article class="pricing-plan/g)].length, 2, 'each parent contains two inner package cards');
  assert.match(panel, /pricing-panel-footnote/);
}
assert.doesNotMatch(pricing, /pricing-addon-strip/, 'parent panels omit duplicate add-on strips');
assert.match(css, /\.pricing-parent-panel[\s\S]*background:/);
assert.match(css, /@media \(max-width: 1100px\)[\s\S]*pricing-billing-grid \{ grid-template-columns: 1fr/);

for (const label of ['Starter', 'Business']) assert.equal(packageCards.filter((card) => card.includes('<h3>' + label + '</h3>')).length, 2, label + ' appears in Subscription and License');
assert.deepEqual(packageCards.map((card) => card.match(/<h3>(Starter|Business)<\/h3>/)?.[1]), ['Starter', 'Business', 'Starter', 'Business']);
assert.doesNotMatch(pricing, /Professional|Custom package/i);
for (const [amount, unit] of [['8,900', 'บาท / เดือน'], ['15,900', 'บาท / เดือน'], ['479,000', '\u0e1a\u0e32\u0e17'], ['709,000', '\u0e1a\u0e32\u0e17']]) assert.ok(pricing.includes('<strong>' + amount + '</strong><span>' + unit + '</span>'), amount + ' ' + unit + ' is shown');
const displayedPrice = (card) => Number(card.match(/pricing-plan__price-main"><strong>([\d,]+)<\/strong>/)?.[1].replaceAll(',', ''));
const licenseAddonPrices = [...pricing.matchAll(/<li><span>License<\/span><strong>\+([\d,]+) บาท<\/strong><\/li>/g)].map(([, amount]) => Number(amount.replaceAll(',', '')));
assert.equal(licenseAddonPrices.length, 3, 'all three License add-ons are shown');
assert.equal(displayedPrice(packageCards[2]) + licenseAddonPrices.reduce((sum, amount) => sum + amount, 0) - displayedPrice(packageCards[3]), 10000, 'Business License saves 10,000 compared with Starter and all add-ons');
const starterCards = packageCards.filter((card) => card.includes('<h3>Starter</h3>'));
for (const card of starterCards) {
  for (const feature of ['POS / CRM / Customer / Sales', 'Quotation / Sales Order', 'Purchase / PR / PO / Supplier', 'Inventory / Warehouse / Coil / Sheet', 'Basic Production / Internal Work Management', 'Dashboard / Report / User / Permission']) assert.ok(card.includes(feature), 'Starter includes ' + feature);
  assert.doesNotMatch(card, /Maintenance|Asset|Logistics|Factory/);
}
const businessCards = packageCards.filter((card) => card.includes('<h3>Business</h3>'));
for (const card of businessCards) {
  assert.match(card, /ทุกฟังก์ชันใน Starter/);
  for (const module of ['Maintenance + Asset', 'Logistics + Logistics App', 'Factory + Factory App']) assert.ok(card.includes(module), 'Business includes ' + module);
}
assert.equal([...pricing.matchAll(/class="pricing-plan__recommended"/g)].length, 2, 'Business cards reuse the recommended badge');
assert.equal([...pricing.matchAll(/class="[^"]*\bpricing-plan__cta\b[^"]*"/g)].length, 4, 'all package cards keep a CTA');
assert.equal([...pricing.matchAll(/class="pricing-plan__recommended"><span class="pricing-plan__recommend-text">\u0e23\u0e27\u0e21 Add-on 3\s+\u0e01\u0e25\u0e38\u0e48\u0e21<\/span>/g)].length, 2, 'Business badges use the requested concise label');
assert.equal(packageCards.filter((card) => card.includes('Subscription')).every((card) => card.includes('\u0e02\u0e2d Demo')), true, 'Subscription cards request a demo');
assert.equal(packageCards.filter((card) => card.includes('License')).every((card) => card.includes('\u0e02\u0e2d\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32')), true, 'License cards request a quote');
assert.match(pricing, /HOSTED · STANDARD/);
assert.match(pricing, /License \+ Customize/);
assert.doesNotMatch(pricing, /12%|15%|18%|MA 1 ปี|Draft Pricing/);
assert.match(pricing, /class="pricing-addon-note"/);
assert.match(pricing, /ราคาไม่รวม VAT · Data Migration, Integration และงานพัฒนาเฉพาะประเมินเพิ่มเติม ·\s*เงื่อนไขบริการเป็นไปตามใบเสนอราคาและข้อตกลง/);
assert.match(pricing, /Business คุ้มกว่า: ประหยัด 1,000 บาท\/เดือน หรือ 10,000 บาทสำหรับ License เมื่อเทียบกับ Starter \+ Add-on ครบ/);
assert.doesNotMatch(pricing, /ข้อมูลเพิ่มเติมด้านการใช้งานและบริการ|pricing-info-grid|pricing-capacity-list/);
assert.match(pricing, /class="pricing-notes"[\s\S]*?ไม่รวม VAT/);
assert.doesNotMatch(pricing, /pricing-support-card|pricing-capacity-grid|pricing-production-note/);
assert.match(pricing, /class="addons-grid pricing-module-grid"/);
for (const module of ['Maintenance + Asset', 'Logistics + Logistics App', 'Factory + Factory App']) assert.match(pricing, new RegExp(module.replace(/[+]/g, '\\+')));
for (const amount of ['+2,000 บาท', '+3,000 บาท', '+60,000 บาท', '+90,000 บาท']) assert.ok(pricing.includes(amount), 'add-on price is present: ' + amount);
assert.match(css, /pricing-plan-grid--packages[\s\S]*grid-template-columns:\s*repeat\(2/);
assert.match(css, /pricing-section \.pricing-plan-grid--packages > \.pricing-group-heading \{ grid-column: 1 \/ -1/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.pricing-plan-grid--packages[^\{]*\{[^}]*grid-template-columns:\s*1fr/);
assert.match(css, /pricing-group-heading \{[\s\S]*?flex-wrap:\s*wrap/);
assert.match(css, /pricing-heading-badge[\s\S]*?overflow-wrap:\s*anywhere/);
assert.doesNotMatch(js, /metalModeButtons|metalAddons|data-pricing-summary|data-pricing-total/);
const heroSection = html.match(/<section class="hero section-shell">[\s\S]*?<\/section>/)?.[0] ?? '';
const workflowSection = html.match(/<section class="section section-shell workflow-section" id="workflow">[\s\S]*?<\/section>/)?.[0] ?? '';
const capabilitySection = html.match(/<section class="section section-shell features-section" id="features">[\s\S]*?<\/section>/)?.[0] ?? '';
assert.match(heroSection, /MINT METAL ERP/);
assert.match(heroSection, /ERP ที่สร้างมาเพื่อธุรกิจเมทัลชีท/);
assert.match(heroSection, /Built for Metal Sheet\s+Manufacturing/);
assert.match(heroSection, /Sales Orders[\s\S]*?Production Orders[\s\S]*?Coil \/ Sheet[\s\S]*?งานพร้อมจัดส่ง/);
assert.match(pricing, /ประหยัด 1,000 บาท\/เดือน/);
assert.match(pricing, /หรือ 10,000 บาทสำหรับ License/);
assert.match(workflowSection, /ONE METAL WORKFLOW/);
assert.match(workflowSection, /เชื่อมงานตั้งแต่รับความต้องการลูกค้า ไปจนถึงการผลิตและส่งมอบ/);
for (const step of ['01 · SALES', '02 · PURCHASE', '03 · INVENTORY', '04 · PRODUCTION']) assert.ok(workflowSection.includes(step), `workflow includes ${step}`);
assert.equal([...workflowSection.matchAll(/class="flow-card(?: flow-optional)? reveal"/g)].length, 4);
assert.equal([...capabilitySection.matchAll(/class="feature-card reveal"/g)].length, 12);
for (const title of ['CRM & Customer', 'Quotation & Sales', 'Purchase / PR / PO', 'Inventory & Warehouse', 'Coil & Sheet Management', 'Product Specification', 'Production Management', 'Cost & Document', 'Dashboard & Reports', 'Maintenance & Asset', 'Logistics & Logistics App', 'Factory & Factory App']) assert.ok(capabilitySection.includes(`<h3>${title}</h3>`), `capabilities include ${title}`);
assert.equal([...capabilitySection.matchAll(/<span>Business<\/span>/g)].length, 3, 'the three Business capabilities are labeled');
const faqNavLink = html.match(/<nav class="main-nav"[\s\S]*?<a href="#faq">([^<]+)<\/a>/);
assert.ok(faqNavLink, 'main navigation FAQ link targets #faq');
for (const question of ['Subscription กับ License ต่างกันอย่างไร?', 'Starter กับ Business ต่างกันอย่างไร?', 'Starter สามารถซื้อ Add-on เพิ่มได้ไหม?', 'ค่าติดตั้งและ Customize คิดอย่างไร?', 'ถ้าต้องการเพิ่ม User / Branch / Warehouse คิดอย่างไร?', 'รองรับสินค้าและลักษณะงานของโรงงานเมทัลชีทหรือไม่?']) assert.ok(visibleFaq.some(([visible]) => visible === question), 'visible FAQ includes ' + question);
assert.match(faq, /<section class="section section-shell faq-section" id="faq">/, 'FAQ anchor points to the FAQ section');
assert.match(css, /\.site-header\s*\{[^}]*position:\s*sticky/);
assert.match(css, /html\s*\{[^}]*scroll-padding-top:\s*92px/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*?html\s*\{[^}]*scroll-padding-top:\s*75px/);
for (const section of [heroSection, workflowSection, capabilitySection]) assert.doesNotMatch(section, /MintHRM|MINT HRM|HRM|Payroll|Attendance|Employee|Work Time|HR Workflow/i);
assert.match(terms, /MINT METAL เป็นระบบ ERP สำหรับธุรกิจและโรงงานเมทัลชีท/);
assert.match(terms, /Subscription/);
assert.match(terms, /<h3>License<\/h3>/);
assert.match(terms, /Customize/);
assert.match(terms, /ราคาและขอบเขตบริการ/);
assert.match(terms, /มิใช่การโอนกรรมสิทธิ์ในลิขสิทธิ์หรือ Source Code/);
assert.match(terms, /href="privacy\.html"[^>]*>นโยบายความเป็นส่วนตัว<\/a>/);
assert.match(terms, /ตั้งแต่ปีที่ 2 การบำรุงรักษาและอัปเดตมาตรฐาน \(MA\) สำหรับ License คิดตามอัตราที่กำหนดจากมูลค่า License ที่ใช้งาน/);
assert.doesNotMatch(terms, /\b(?:12|15|18)%\b/);
assert.doesNotMatch(privacy, /แบบฟอร์มบนเว็บไซต์|แบบฟอร์มติดต่อบนเว็บไซต์|กรอกแบบฟอร์ม|ข้อมูลที่กรอกในแบบฟอร์ม|ผ่านแบบฟอร์ม/i, 'privacy does not describe a current website form flow');
assert.doesNotMatch(privacy, /จำหน่ายสิทธิการใช้งานระบบบริหารทรัพยากรบุคคลแบบ License<\/p>/, 'privacy does not describe a License-only public offering');
assert.match(privacy, /เว็บไซต์สาธารณะ/);
assert.match(privacy, /การติดต่อทางธุรกิจกับบริษัท/);
assert.match(privacy, /ข้อมูลในระบบ MINT METAL/);
assert.doesNotMatch(privacy, /Cloudflare|Turnstile|Postmark|ป้องกันบอท|สแปม/i, 'privacy does not describe obsolete Cloudflare or form anti-bot processing');
assert.doesNotMatch(privacy, /คุกกี้ที่จำเป็น|IP Address เบราว์เซอร์ อุปกรณ์ ระบบปฏิบัติการ Log/i, 'privacy does not assert unverified static-site cookies or technical logs');
assert.doesNotMatch(privacy + terms, /Real-time GPS Tracking|ติดตามตำแหน่งแบบเรียลไทม์|ติดตามตำแหน่งอย่างต่อเนื่อง/i, 'legal pages do not claim continuous or real-time GPS tracking');
assert.doesNotMatch(terms, /API มาตรฐาน|Standard API|Public API|API สาธารณะ/i, 'Terms does not claim a standard or public API');
assert.doesNotMatch(terms, /\bSSO\b|Single Sign-On/i, 'Terms does not claim SSO');
assert.match(terms, /การเชื่อมต่อระบบหรือช่องทางข้อมูลตามขอบเขตโครงการ/);
assert.match(terms, /การปรับขั้นตอนการทำงานเพิ่มเติมตามขอบเขตโครงการ/);
assert.match(terms, /การอัปเดตมาตรฐานสำหรับ Subscription ให้เป็นไปตามขอบเขตบริการที่ระบุในแพ็กเกจ/);
assert.doesNotMatch(terms, /18%[^<\n]*(?:Add-on|ส่วนเสริม|ฐาน License|เฉพาะค่า License หลัก)/i, 'Terms does not define the unapproved MA calculation base');
assert.doesNotMatch(terms, /\bSLA\b|24\s*\/\s*7|Dedicated Cloud/i, 'Terms does not introduce unapproved service commitments');
for (const legalPage of [privacy, terms]) {
  assert.match(legalPage, /sale@alexiasoft\.co/);
  assert.match(legalPage, /061-697-5959/);
  assert.match(legalPage, /href="privacy\.html"|href="terms\.html"/);
}
assert.match(privacy, /href="terms\.html"/);
assert.match(terms, /href="privacy\.html"/);
assert.match(html, /href="privacy\.html"/);
assert.match(html, /href="terms\.html"/);
assert.doesNotMatch(terms, /refund|คืนเงิน|\bSLA\b|uptime|99\.\d+%|ชำระภายใน\s*\d+\s*วัน|แจ้งยกเลิกล่วงหน้า\s*\d+/i, 'no unsupported refund, SLA, uptime, or payment-period promises');
assert.match(sitemap, /<loc>https:\/\/mintmetal\.alexiasoft\.co\/privacy\.html<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/mintmetal\.alexiasoft\.co\/terms\.html<\/loc>/);
assert.match(terms, /href="index\.html(?:#[^"]*)?"/);
for (const [, path] of terms.matchAll(/(?:href|src)="((?:index\.html|privacy\.html|terms\.html|assets\/)[^"#?]*)/g)) {
  assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} resolves from Terms`);
}
assert.match(terms, /sale@alexiasoft\.co/);
assert.match(terms, /061-697-5959/);
console.log('MINT METAL landing smoke checks passed');
