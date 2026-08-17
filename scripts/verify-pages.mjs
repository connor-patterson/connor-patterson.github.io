#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const outputRoot = path.join(repositoryRoot, 'dist', 'personal-website', 'browser');

const baseHref = '/';
const siteUrl = 'https://connor-patterson.github.io/';
const requiredFiles = [
  ['résumé', 'assets/ConnorPattersonResume2026.pdf'],
  ['favicon', 'favicon.svg'],
  ['web app manifest', 'site.webmanifest'],
  ['robots policy', 'robots.txt'],
  ['sitemap', 'sitemap.xml'],
  ['social preview', 'assets/social-card.png'],
  ['social preview source', 'assets/social-card.svg'],
  ['print evidence brief', 'evidence-brief.html'],
  ['print evidence behavior', 'evidence-brief.js'],
  ['Isotara system map', 'assets/evidence/isotara-system-map.svg'],
  ['PredictChain system map', 'assets/evidence/predictchain-system-map.svg'],
  ['case study styles', 'case-studies/case-study.css'],
  ['case study font', 'assets/fonts/space-grotesk-latin-wght-normal.woff2'],
  ['latency case study', 'case-studies/latency/index.html'],
  ['secure delivery case study', 'case-studies/secure-delivery/index.html'],
];
const staticPages = [
  {
    path: 'case-studies/latency/index.html',
    canonical: `${siteUrl}case-studies/latency/`,
  },
  {
    path: 'case-studies/secure-delivery/index.html',
    canonical: `${siteUrl}case-studies/secure-delivery/`,
  },
  {
    path: 'evidence-brief.html',
    canonical: `${siteUrl}evidence-brief.html`,
  },
];

const failures = [];

function addFailure(message) {
  failures.push(message);
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(directoryPath) {
  try {
    return (await stat(directoryPath)).isDirectory();
  } catch {
    return false;
  }
}

async function collectFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function getAttribute(tag, attributeName) {
  const expression = new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  );
  const match = expression.exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function hasRel(relValue, expected) {
  return relValue
    ?.toLowerCase()
    .split(/\s+/u)
    .some((value) => value === expected);
}

function isExternalUrl(value) {
  return /^(?:https?:)?\/\//iu.test(value.trim());
}

function isExpectedSiteReference(value, expectedPath) {
  const withoutQueryOrFragment = value.trim().split(/[?#]/u, 1)[0];
  return [expectedPath, `./${expectedPath}`, `${baseHref}${expectedPath}`].includes(
    withoutQueryOrFragment,
  );
}

function metaContent(indexHtml, selectorAttribute, selectorValue) {
  const tags = indexHtml.match(/<meta\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    if (getAttribute(tag, selectorAttribute)?.toLowerCase() === selectorValue.toLowerCase()) {
      return getAttribute(tag, 'content');
    }
  }
  return null;
}

function canonicalHref(html) {
  const linkTags = html.match(/<link\b[^>]*>/giu) ?? [];
  const canonical = linkTags.find((tag) => hasRel(getAttribute(tag, 'rel'), 'canonical'));
  return canonical ? getAttribute(canonical, 'href') : null;
}

function verifyBaseHref(indexHtml) {
  const baseTags = indexHtml.match(/<base\b[^>]*>/giu) ?? [];
  if (baseTags.length !== 1) {
    addFailure(`index.html must contain exactly one <base> tag; found ${baseTags.length}.`);
    return;
  }

  const actualBaseHref = getAttribute(baseTags[0], 'href');
  if (actualBaseHref !== baseHref) {
    addFailure(`index.html base href must be "${baseHref}"; found "${actualBaseHref ?? ''}".`);
  }
}

function verifyPrimaryReferences(indexHtml) {
  const linkTags = indexHtml.match(/<link\b[^>]*>/giu) ?? [];
  const iconReference = linkTags.find((tag) => hasRel(getAttribute(tag, 'rel'), 'icon'));
  const manifestReference = linkTags.find((tag) => hasRel(getAttribute(tag, 'rel'), 'manifest'));

  if (
    !iconReference ||
    !isExpectedSiteReference(getAttribute(iconReference, 'href') ?? '', 'favicon.svg')
  ) {
    addFailure('index.html must reference the bundled favicon.svg.');
  }

  if (
    !manifestReference ||
    !isExpectedSiteReference(getAttribute(manifestReference, 'href') ?? '', 'site.webmanifest')
  ) {
    addFailure('index.html must reference the bundled site.webmanifest.');
  }

  if (!indexHtml.includes('assets/ConnorPattersonResume2026.pdf')) {
    addFailure('index.html must expose the current résumé as a direct fallback link.');
  }

  const expectedSocialImage = `${siteUrl}assets/social-card.png`;
  if (metaContent(indexHtml, 'property', 'og:image') !== expectedSocialImage) {
    addFailure(`og:image must reference "${expectedSocialImage}".`);
  }
  if (metaContent(indexHtml, 'name', 'twitter:image') !== expectedSocialImage) {
    addFailure(`twitter:image must reference "${expectedSocialImage}".`);
  }
  if (!metaContent(indexHtml, 'name', 'twitter:image:alt')) {
    addFailure('index.html must provide twitter:image:alt text.');
  }
}

function verifyNoExternalHtmlRuntime(filePath, html) {
  const relativePath = path.relative(outputRoot, filePath);
  const scriptTags = html.match(/<script\b[^>]*>/giu) ?? [];
  const linkTags = html.match(/<link\b[^>]*>/giu) ?? [];

  for (const tag of scriptTags) {
    const source = getAttribute(tag, 'src');
    if (source && isExternalUrl(source)) {
      addFailure(`${relativePath} loads an external runtime script: ${source}`);
    }
  }

  for (const tag of linkTags) {
    const rel = getAttribute(tag, 'rel');
    const as = getAttribute(tag, 'as')?.toLowerCase();
    const isRuntimeResource =
      hasRel(rel, 'stylesheet') ||
      hasRel(rel, 'modulepreload') ||
      (hasRel(rel, 'preload') && (as === 'script' || as === 'style'));
    const href = getAttribute(tag, 'href');

    if (isRuntimeResource && href && isExternalUrl(href)) {
      addFailure(`${relativePath} loads an external runtime script or style: ${href}`);
    }
  }

  const mediaTags = html.match(/<(?:audio|iframe|img|source|video)\b[^>]*>/giu) ?? [];
  for (const tag of mediaTags) {
    const references = [getAttribute(tag, 'src'), getAttribute(tag, 'poster')].filter(Boolean);
    for (const reference of references) {
      if (isExternalUrl(reference)) {
        addFailure(`${relativePath} loads external media: ${reference}`);
      }
    }
  }

  if (/<[a-z][^>]*\son[a-z]+\s*=/iu.test(html)) {
    addFailure(`${relativePath} contains an inline event handler.`);
  }

  const inlineScripts = html.match(/<script\b([^>]*)>([\s\S]*?)<\/script>/giu) ?? [];
  for (const script of inlineScripts) {
    const openingTag = script.slice(0, script.indexOf('>') + 1);
    const type = getAttribute(openingTag, 'type')?.toLowerCase();
    const hasSource = Boolean(getAttribute(openingTag, 'src'));
    const body = script.slice(openingTag.length, script.lastIndexOf('</script>')).trim();
    if (!hasSource && body && type !== 'application/ld+json') {
      addFailure(`${relativePath} contains an inline executable script.`);
    }
  }
}

function verifyNoExternalCssRuntime(filePath, css) {
  const externalCssReference = /(?:@import\s+(?:url\(\s*)?|url\(\s*)["']?(?:https?:)?\/\//iu.exec(
    css,
  );
  if (externalCssReference) {
    addFailure(
      `${path.relative(outputRoot, filePath)} contains an external CSS runtime URL: ${externalCssReference[0]}`,
    );
  }
}

async function verifyLocalReference(ownerPath, reference) {
  const trimmed = reference.trim();
  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    /^(?:data|mailto|tel):/iu.test(trimmed) ||
    isExternalUrl(trimmed)
  ) {
    return;
  }

  const cleanReference = trimmed.split(/[?#]/u, 1)[0];
  if (!cleanReference) {
    return;
  }

  const candidate = cleanReference.startsWith('/')
    ? path.resolve(outputRoot, cleanReference.replace(/^\//u, ''))
    : path.resolve(path.dirname(ownerPath), cleanReference);
  const rootPrefix = `${outputRoot}${path.sep}`;
  if (candidate !== outputRoot && !candidate.startsWith(rootPrefix)) {
    addFailure(
      `${path.relative(outputRoot, ownerPath)} references a file outside the artifact: ${reference}`,
    );
    return;
  }

  const target = cleanReference.endsWith('/') ? path.join(candidate, 'index.html') : candidate;
  if (!(await isFile(target))) {
    addFailure(
      `${path.relative(outputRoot, ownerPath)} references a missing local file: ${reference}`,
    );
  }
}

async function verifyLocalHtmlReferences(filePath, html) {
  const tags = html.match(/<(?:a|img|link|script)\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    const reference =
      getAttribute(tag, tag.toLowerCase().startsWith('<a') ? 'href' : 'src') ??
      getAttribute(tag, 'href');
    if (reference) {
      await verifyLocalReference(filePath, reference);
    }
  }
}

async function verifyLocalCssReferences(filePath, css) {
  const references = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)].map(
    (match) => match[1],
  );
  for (const reference of references) {
    await verifyLocalReference(filePath, reference);
  }
}

async function verifyStaticPages() {
  for (const staticPage of staticPages) {
    const filePath = path.join(outputRoot, staticPage.path);
    if (!(await isFile(filePath))) {
      continue;
    }

    const html = await readFile(filePath, 'utf8');
    if (canonicalHref(html) !== staticPage.canonical) {
      addFailure(`${staticPage.path} must use canonical URL "${staticPage.canonical}".`);
    }
    if ((html.match(/<h1\b/giu) ?? []).length !== 1) {
      addFailure(`${staticPage.path} must contain exactly one h1.`);
    }
    if (!metaContent(html, 'name', 'description')) {
      addFailure(`${staticPage.path} must provide a meta description.`);
    }
    if (metaContent(html, 'property', 'og:url') !== staticPage.canonical) {
      addFailure(`${staticPage.path} must use its canonical URL as og:url.`);
    }
    const expectedSocialImage = `${siteUrl}assets/social-card.png`;
    if (metaContent(html, 'property', 'og:image') !== expectedSocialImage) {
      addFailure(`${staticPage.path} must use the bundled social card as og:image.`);
    }
    for (const [attribute, name] of [
      ['property', 'og:title'],
      ['property', 'og:description'],
      ['property', 'og:image:alt'],
      ['name', 'twitter:card'],
      ['name', 'twitter:title'],
      ['name', 'twitter:description'],
      ['name', 'twitter:image:alt'],
    ]) {
      if (!metaContent(html, attribute, name)) {
        addFailure(`${staticPage.path} must provide ${name}.`);
      }
    }
    if (metaContent(html, 'name', 'twitter:image') !== expectedSocialImage) {
      addFailure(`${staticPage.path} must use the bundled social card as twitter:image.`);
    }
    const icon = (html.match(/<link\b[^>]*>/giu) ?? []).find((tag) =>
      hasRel(getAttribute(tag, 'rel'), 'icon'),
    );
    if (!icon) {
      addFailure(`${staticPage.path} must reference the bundled favicon.`);
    }
  }
}

async function verifyResumePdf() {
  const resumePath = path.join(outputRoot, 'assets', 'ConnorPattersonResume2026.pdf');
  if (!(await isFile(resumePath))) {
    return;
  }

  const resume = await readFile(resumePath);
  if (
    resume.length < 4_000 ||
    resume.subarray(0, 5).toString('ascii') !== '%PDF-' ||
    !resume
      .subarray(Math.max(0, resume.length - 1_024))
      .toString('ascii')
      .includes('%%EOF')
  ) {
    addFailure('assets/ConnorPattersonResume2026.pdf is not a complete PDF file.');
  }
}

async function verifyManifest() {
  const manifestPath = path.join(outputRoot, 'site.webmanifest');
  if (!(await isFile(manifestPath))) {
    return;
  }

  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (manifest.start_url !== baseHref) {
      addFailure(`site.webmanifest start_url must be "${baseHref}".`);
    }
    if (manifest.scope !== baseHref) {
      addFailure(`site.webmanifest scope must be "${baseHref}".`);
    }
  } catch (error) {
    addFailure(`site.webmanifest is not valid JSON: ${error.message}`);
  }
}

async function verifySocialImage() {
  const imagePath = path.join(outputRoot, 'assets', 'social-card.png');
  if (!(await isFile(imagePath))) {
    return;
  }

  const image = await readFile(imagePath);
  const pngSignature = '89504e470d0a1a0a';
  if (image.subarray(0, 8).toString('hex') !== pngSignature || image.length < 24) {
    addFailure('assets/social-card.png is not a valid PNG file.');
    return;
  }

  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    addFailure(`assets/social-card.png must be 1200×630; found ${width}×${height}.`);
  }
}

async function verifySearchMetadata() {
  const robotsPath = path.join(outputRoot, 'robots.txt');
  const sitemapPath = path.join(outputRoot, 'sitemap.xml');

  if (await isFile(robotsPath)) {
    const robots = await readFile(robotsPath, 'utf8');
    const expectedSitemap = `Sitemap: ${siteUrl}sitemap.xml`;
    if (!robots.includes(expectedSitemap)) {
      addFailure(`robots.txt must include "${expectedSitemap}".`);
    }
  }

  if (await isFile(sitemapPath)) {
    const sitemap = await readFile(sitemapPath, 'utf8');
    for (const expectedUrl of [siteUrl, ...staticPages.map((page) => page.canonical)]) {
      if (!sitemap.includes(`<loc>${expectedUrl}</loc>`)) {
        addFailure(`sitemap.xml must include the canonical URL "${expectedUrl}".`);
      }
    }
  }
}

async function main() {
  if (!(await isDirectory(outputRoot))) {
    throw new Error(
      `Build output not found at ${outputRoot}. Run "npm run build:pages" before verification.`,
    );
  }

  for (const [label, relativePath] of requiredFiles) {
    if (!(await isFile(path.join(outputRoot, relativePath)))) {
      addFailure(`Missing required ${label}: ${relativePath}`);
    }
  }

  if (await isFile(path.join(outputRoot, '404.html'))) {
    addFailure(
      'Unexpected 404.html. Hash routing and the gh-pages noNotfound option must remain the SPA contract.',
    );
  }

  const indexPath = path.join(outputRoot, 'index.html');
  if (!(await isFile(indexPath))) {
    addFailure('Missing required application entry point: index.html');
  } else {
    const indexHtml = await readFile(indexPath, 'utf8');
    verifyBaseHref(indexHtml);
    verifyPrimaryReferences(indexHtml);
  }

  const artifactFiles = await collectFiles(outputRoot);
  for (const filePath of artifactFiles) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.html') {
      const html = await readFile(filePath, 'utf8');
      verifyNoExternalHtmlRuntime(filePath, html);
      await verifyLocalHtmlReferences(filePath, html);
    } else if (extension === '.css') {
      const css = await readFile(filePath, 'utf8');
      verifyNoExternalCssRuntime(filePath, css);
      await verifyLocalCssReferences(filePath, css);
    }
  }

  await verifyManifest();
  await verifySocialImage();
  await verifyResumePdf();
  await verifySearchMetadata();
  await verifyStaticPages();

  if (failures.length > 0) {
    console.error(`GitHub Pages artifact verification failed (${failures.length}):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `GitHub Pages artifact verified: ${path.relative(repositoryRoot, outputRoot)} (${artifactFiles.length} files).`,
  );
  console.log(`Base href: ${baseHref}`);
  console.log('Routing: hash-based; no 404.html fallback');
  console.log('Runtime scripts/styles: local artifact references only');
}

main().catch((error) => {
  console.error(`GitHub Pages artifact verification could not run: ${error.message}`);
  process.exitCode = 1;
});
