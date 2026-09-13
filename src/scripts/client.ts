import { createIcons, Archive, ArrowUp, ArrowUpRight, Bell, Calendar, Check, ChevronRight, Clock, Copy, Folder, Github, House, Library, Link, LockKeyhole, Maximize, Megaphone, Menu, NotebookPen, Rss, Search, SunMoon, Tags, UserRound, X } from 'lucide';
import { t } from '../lib/i18n';
import { decryptContent } from '../lib/crypto/decrypt';

const text = t();
const base = document.body.dataset.base ?? '';
const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => [...root.querySelectorAll<T>(selector)];
const icons = { Archive, ArrowUp, ArrowUpRight, Bell, Calendar, Check, ChevronRight, Clock, Copy, Folder, Github, House, Library, Link, LockKeyhole, Maximize, Megaphone, Menu, NotebookPen, Rss, Search, SunMoon, Tags, UserRound, X };
function refreshIcons() { createIcons({ icons, attrs: { 'aria-hidden': 'true', class: 'icon' } }); }
function iconButton(name: string, label: string) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'icon-button'; button.title = label; button.setAttribute('aria-label', label);
  const icon = document.createElement('span'); icon.dataset.lucide = name; button.append(icon);
  return button;
}
function readStorage(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStorage(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }
refreshIcons();

const themeButton = $('#theme-toggle');
function updateThemeState() { themeButton?.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark'))); }
updateThemeState();
themeButton?.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  writeStorage('linxi-theme', dark ? 'dark' : 'light'); updateThemeState();
});
$('#menu-toggle')?.addEventListener('click', () => {
  const opened = $('#site-nav')?.classList.toggle('open');
  $('#menu-toggle')?.setAttribute('aria-expanded', String(opened));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    $('#site-nav')?.classList.remove('open'); $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('click', (event) => {
  if (!(event.target as Element).closest('#site-nav, #menu-toggle')) {
    $('#site-nav')?.classList.remove('open'); $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
  }
});

const dismissed = new Set<string>();
try { const value = JSON.parse(readStorage('linxi-notices') ?? '[]'); if (Array.isArray(value)) value.forEach((id) => dismissed.add(String(id))); } catch {}
let showReadNotices = false;
function refreshNotices() {
  const now = Date.now();
  $$('.announcement').forEach((notice) => {
    const active = (!notice.dataset.start || Date.parse(notice.dataset.start) <= now)
      && (!notice.dataset.end || now <= Date.parse(notice.dataset.end));
    notice.hidden = !active || (!showReadNotices && dismissed.has(notice.dataset.notice!));
  });
}
refreshNotices();
window.setInterval(refreshNotices, 60_000);
$$('.dismiss-notice').forEach((button) => button.addEventListener('click', () => {
  const notice = button.closest<HTMLElement>('[data-notice]')!;
  dismissed.add(notice.dataset.notice!); writeStorage('linxi-notices', JSON.stringify([...dismissed]));
  showReadNotices = false; refreshNotices();
}));
$('#announcement-open')?.addEventListener('click', () => { showReadNotices = !showReadNotices; refreshNotices(); });

$$<HTMLDialogElement>('dialog').forEach((dialog) => {
  $('.close-dialog', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
});

interface SearchResult { data(): Promise<{ url: string; meta: { title?: string }; excerpt: string }> }
interface SearchIndex { search(term: string): Promise<{ results: SearchResult[] }>; options(options: { baseUrl: string }): Promise<void> }
let indexPromise: Promise<SearchIndex> | undefined;
const searchInput = document.createElement('input');
searchInput.type = 'search'; searchInput.className = 'search-input'; searchInput.placeholder = text.searchPlaceholder;
searchInput.setAttribute('aria-label', text.search); searchInput.autocomplete = 'off';
const searchResults = document.createElement('ul'); searchResults.className = 'search-results';
$('#search-container')?.append(searchInput, searchResults);
$('#search-open')?.addEventListener('click', () => { $('#search-dialog') && $<HTMLDialogElement>('#search-dialog')!.showModal(); searchInput.focus(); });
let searchVersion = 0;
let searchTimer: ReturnType<typeof setTimeout>;
searchInput.addEventListener('input', () => {
  const version = ++searchVersion;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const query = searchInput.value.trim();
    searchResults.replaceChildren();
    const status = $('#search-status')!;
    if (!query) { status.textContent = ''; return; }
    status.textContent = '…';
    try {
      indexPromise ??= import(/* @vite-ignore */ `${base}/pagefind/pagefind.js`).then(async (index: SearchIndex) => {
        await index.options({ baseUrl: `${base}/` }); return index;
      });
      const index = await indexPromise;
      const result = await index.search(query);
      const entries = await Promise.all(result.results.slice(0, 25).map((entry) => entry.data()));
      if (version !== searchVersion) return;
      status.textContent = `${result.results.length}`;
      for (const entry of entries) {
        const li = document.createElement('li'), link = document.createElement('a'), heading = document.createElement('h3'), excerpt = document.createElement('p');
        link.href = entry.url; heading.textContent = entry.meta.title ?? entry.url;
        excerpt.textContent = new DOMParser().parseFromString(entry.excerpt, 'text/html').body.textContent;
        link.append(heading, excerpt); li.append(link); searchResults.append(li);
      }
    } catch {
      indexPromise = undefined;
      if (version === searchVersion) status.textContent = document.body.dataset.locale === 'zh' ? '搜索暂不可用。' : 'Search is unavailable.';
    }
  }, 180);
});

const fontSlider = $<HTMLInputElement>('#font-size');
if (fontSlider) {
  const stored = Number(readStorage('linxi-font-size'));
  fontSlider.value = String(stored >= 14 && stored <= 24 ? stored : 17);
  $('#font-size-value')!.textContent = fontSlider.value;
  fontSlider.addEventListener('input', () => {
    document.documentElement.style.setProperty('--reading-size', `${fontSlider.value}px`);
    $('#font-size-value')!.textContent = fontSlider.value; writeStorage('linxi-font-size', fontSlider.value);
  });
}

let headings: HTMLElement[] = [];
function updateToc() {
  const container = $('#toc-links');
  headings = $$<HTMLElement>('#article-content h2, #article-content h3');
  if (!container) return;
  container.replaceChildren();
  headings.forEach((heading, i) => {
    // Rebuild from visible DOM only, including newly decrypted sections.
    if (!heading.id) heading.id = `section-${i + 1}`;
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(heading.id)}`; link.textContent = heading.textContent;
    link.dataset.level = heading.tagName.slice(1); container.append(link);
  });
}
function updateProgress() {
  const content = $('#article-content');
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  $<HTMLProgressElement>('#reading-progress')!.value = content ? Math.min(100, scrollY / max * 100) : 0;
  $('#back-top')!.hidden = scrollY < 400;
  let current = headings[0]?.id;
  for (const heading of headings) if (heading.getBoundingClientRect().top < 150) current = heading.id;
  $$('#toc-links a').forEach((link) => link.classList.toggle('current', decodeURIComponent(link.getAttribute('href')!.slice(1)) === current));
}
window.addEventListener('scroll', updateProgress, { passive: true });
$('#back-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

async function enhance(root: ParentNode) {
  $$<HTMLImageElement>('.prose img:not([data-enhanced])', root).forEach((image) => {
    image.dataset.enhanced = 'true'; image.tabIndex = 0; image.setAttribute('role', 'button'); image.setAttribute('aria-label', `${text.fullscreen}: ${image.alt}`);
    function open() {
      const target = $<HTMLImageElement>('#lightbox-image')!;
      target.src = image.currentSrc || image.src; target.alt = image.alt;
      $<HTMLDialogElement>('#image-dialog')!.showModal();
    }
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  $$('table:not([data-enhanced])', root).forEach((table) => {
    table.dataset.enhanced = 'true'; const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll'; table.before(wrapper); wrapper.append(table);
  });
  $$('.spoiler:not([data-enhanced]), spoiler-span:not([data-enhanced])', root).forEach((spoiler) => {
    spoiler.dataset.enhanced = 'true'; spoiler.tabIndex = 0; spoiler.setAttribute('role', 'button');
    spoiler.setAttribute('aria-expanded', 'false');
    const reveal = () => { spoiler.classList.toggle('revealed'); spoiler.setAttribute('aria-expanded', String(spoiler.classList.contains('revealed'))); };
    spoiler.addEventListener('click', reveal);
    spoiler.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reveal(); } });
  });
  $$('.tab-group:not([data-enhanced])', root).forEach((group, groupIndex) => {
    group.dataset.enhanced = 'true';
    const tabs = $$<HTMLButtonElement>(':scope > .tab-headers > .tab-header', group), panels = $$(':scope > .tab-panel', group);
    function activate(index: number) {
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i]?.classList.toggle('active', i === index); });
    }
    tabs.forEach((tab, i) => {
      tab.id = `tab-${groupIndex}-${i}`; tab.setAttribute('aria-controls', `panel-${groupIndex}-${i}`);
      if (panels[i]) { panels[i].id = `panel-${groupIndex}-${i}`; panels[i].setAttribute('aria-labelledby', tab.id); }
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activate(next); tabs[next].focus();
      });
    }); activate(0);
  });
  $$('pre:not([data-enhanced])', root).forEach((pre) => {
    pre.dataset.enhanced = 'true';
    const source = $('code', pre)?.textContent ?? pre.textContent ?? '';
    const wrapper = document.createElement('div'), toolbar = document.createElement('div'), label = document.createElement('span');
    wrapper.className = 'code-wrapper'; toolbar.className = 'code-toolbar';
    label.textContent = pre.dataset.title ?? pre.dataset.language ?? '';
    const copy = iconButton('copy', text.copy), fullscreen = iconButton('maximize', text.fullscreen);
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(source); copy.title = text.copied; copy.setAttribute('aria-label', text.copied); }
      catch { copy.title = 'Clipboard unavailable'; }
    });
    fullscreen.addEventListener('click', async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (wrapper.requestFullscreen) await wrapper.requestFullscreen();
    });
    toolbar.append(label, copy, fullscreen); pre.before(wrapper); wrapper.append(toolbar, pre);
    const lang = pre.dataset.language ?? $('code', pre)?.className.replace('language-', '') ?? '';
    if (['mermaid', 'infographic'].includes(lang)) void renderDiagram(pre, source, lang);
  });
  $$('.encrypted-block[data-cipher]:not([data-enhanced])', root).forEach((block) => {
    block.dataset.enhanced = 'true';
    const form = document.createElement('form'), label = document.createElement('label'), input = document.createElement('input'), button = document.createElement('button'), error = document.createElement('p');
    form.className = 'unlock-form'; label.textContent = text.encrypted; input.type = 'password'; input.required = true; input.autocomplete = 'off'; input.placeholder = text.password; input.setAttribute('aria-label', text.password);
    button.type = 'submit'; button.className = 'button'; button.textContent = text.unlock;
    error.setAttribute('role', 'status'); form.append(label, input, button, error); block.append(form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); button.disabled = true; error.textContent = '';
      const plaintext = await decryptContent(block.dataset.cipher!, block.dataset.iv!, block.dataset.salt!, input.value);
      input.value = ''; button.disabled = false;
      if (plaintext === null) { error.textContent = text.wrongPassword; return; }
      const template = document.createElement('template'); template.innerHTML = plaintext;
      block.replaceChildren(template.content); block.classList.remove('encrypted-block');
      block.removeAttribute('data-cipher'); block.removeAttribute('data-iv'); block.removeAttribute('data-salt');
      await enhance(block); updateToc(); updateProgress();
    });
  });
  await enhanceMedia(root);
  enhanceQuizzes(root);
  refreshIcons(); updateToc(); updateProgress();
}

let diagramId = 0;
async function renderDiagram(pre: HTMLElement, source: string, language: string) {
  const output = document.createElement('div'); output.className = 'diagram-output'; pre.after(output);
  try {
    if (language === 'mermaid') {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'system-ui' });
      const result = await mermaid.render(`diagram-${++diagramId}`, source);
      output.innerHTML = result.svg;
    } else {
      const { Infographic, setDefaultFont, getFonts, registerFont } = await import('@antv/infographic');
      // The renderer preloads all registered fonts, not only the selected family.
      for (const font of getFonts()) {
        const family = font.fontFamily.replace(/^(["'])(.*)\1$/, '$2');
        registerFont({ ...font, fontFamily: family, baseUrl: '', fontWeight: {} });
      }
      setDefaultFont('sans-serif');
      const graphic = new Infographic({ container: output, width: '100%', height: 420, themeConfig: { base: { text: { 'font-family': 'sans-serif' } } } });
      graphic.render(source);
    }
    pre.hidden = true;
    const details = document.createElement('details'), summary = document.createElement('summary');
    summary.textContent = text.source; pre.before(details); details.append(summary, pre); pre.hidden = false;
  } catch {
    output.classList.add('diagram-error'); output.textContent = language === 'mermaid' ? 'Mermaid: invalid diagram' : 'Infographic: invalid diagram';
  }
}

async function enhanceMedia(root: ParentNode) {
  $$('[data-audio-player]:not([data-enhanced]), [data-video-player]:not([data-enhanced])', root).forEach((container) => {
    container.dataset.enhanced = 'true';
    try {
      const data = JSON.parse(container.dataset.src ?? '[]') as { title?: string; name?: string; list?: string[]; url?: string }[];
      const tracks = data.flatMap((item) => item.list ? item.list.map((url) => ({ url, name: item.title ?? url.split('/').pop()! })) : item.url ? [{ url: item.url, name: item.name ?? item.url.split('/').pop()! }] : []);
      if (!tracks.length) return;
      const media = document.createElement(container.hasAttribute('data-audio-player') ? 'audio' : 'video');
      media.controls = true; media.preload = 'metadata'; media.className = 'media-player';
      const select = document.createElement('select'); select.className = 'media-playlist'; select.setAttribute('aria-label', 'Media');
      for (const track of tracks) {
        const url = new URL(track.url, location.origin);
        if (url.origin !== location.origin || !url.pathname.startsWith(`${base}/`)) throw new Error('Local media only');
        const option = document.createElement('option'); option.value = track.url; option.textContent = track.name; select.append(option);
      }
      media.src = tracks[0].url;
      select.addEventListener('change', () => { media.src = select.value; media.load(); });
      media.addEventListener('ended', () => { if (select.selectedIndex < select.options.length - 1) { select.selectedIndex++; media.src = select.value; void media.play(); } });
      container.append(select, media);
    } catch { container.textContent = 'Local media unavailable'; }
  });
}

function enhanceQuizzes(root: ParentNode) {
  $$('li.quiz:not([data-enhanced])', root).forEach((quiz, quizIndex) => {
    quiz.dataset.enhanced = 'true';
    const controls = document.createElement('div'); controls.className = 'quiz-controls';
    const explanation = $(':scope > blockquote', quiz); if (explanation) explanation.hidden = true;
    const result = document.createElement('p'); result.className = 'quiz-result'; result.setAttribute('role', 'status');
    const check = document.createElement('button'); check.className = 'button'; check.textContent = text.submitted; check.type = 'button';
    const reset = document.createElement('button'); reset.className = 'button secondary'; reset.textContent = text.reset; reset.type = 'button';
    const answers: { input: HTMLInputElement; correct: boolean | string }[] = [];
    const options = $$(':scope > ul > li', quiz);
    if (quiz.classList.contains('fill')) {
      $$('.gap', quiz).forEach((gap) => {
        const input = document.createElement('input'); input.type = 'text'; input.setAttribute('aria-label', text.password === '密码' ? '填空答案' : 'Answer');
        answers.push({ input, correct: gap.textContent?.trim() ?? '' }); gap.replaceWith(input);
      });
    } else if (options.length) {
      options.forEach((option) => {
        const input = document.createElement('input');
        input.type = quiz.classList.contains('multi') ? 'checkbox' : 'radio'; input.name = `quiz-${quizIndex}`;
        answers.push({ input, correct: option.classList.contains('correct') });
        const label = document.createElement('label'); label.append(input, ...option.childNodes); option.append(label);
      });
    } else {
      for (const [value, name] of [[true, 'True'], [false, 'False']] as const) {
        const label = document.createElement('label'), input = document.createElement('input'); input.type = 'radio'; input.name = `quiz-${quizIndex}`;
        answers.push({ input, correct: value === quiz.classList.contains('true') }); label.append(input, name); controls.append(label);
      }
    }
    check.addEventListener('click', () => {
      const correct = answers.length > 0 && answers.every(({ input, correct }) => typeof correct === 'string' ? input.value.trim() === correct : input.checked === correct);
      result.textContent = correct ? text.correct : text.incorrect; if (explanation) explanation.hidden = false;
    });
    reset.addEventListener('click', () => { answers.forEach(({ input }) => { input.checked = false; input.value = ''; }); result.textContent = ''; if (explanation) explanation.hidden = true; });
    controls.append(check, reset); quiz.append(controls, result);
  });
}

void enhance(document);
if (document.documentElement.dataset.seasonal === 'true' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const canvas = document.createElement('canvas'); canvas.className = 'seasonal-canvas'; canvas.setAttribute('aria-hidden', 'true'); document.body.append(canvas);
  const context = canvas.getContext('2d');
  const flakes = Array.from({ length: innerWidth < 760 ? 18 : 40 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 2 + 1 }));
  let last = performance.now();
  const draw = (now: number) => {
    const delta = Math.min(32, now - last); last = now;
    canvas.width = innerWidth; canvas.height = innerHeight;
    if (context && !document.hidden) {
      context.fillStyle = '#badad9';
      flakes.forEach((flake) => { flake.y = (flake.y + delta * .00002) % 1; context.beginPath(); context.arc(flake.x * innerWidth, flake.y * innerHeight, flake.size, 0, Math.PI * 2); context.fill(); });
    }
    requestAnimationFrame(draw);
  }; requestAnimationFrame(draw);
}
