import assert from 'node:assert/strict';
import { site } from '../src/config/site';
import { siteBase } from '../src/lib/urls';

const repository = process.env.GITHUB_REPOSITORY;
assert.ok(repository, 'Run this check in GitHub Actions or set GITHUB_REPOSITORY=owner/repo.');
const [owner, name] = repository.split('/');
const expectedBase = name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? '' : `/${name}`;
assert.equal(siteBase, expectedBase, `Pages path mismatch: this repository requires base "${expectedBase}".`);
assert.equal(new URL(site.repository).pathname.replace(/^\/|\/$/g, '').toLowerCase(), repository.toLowerCase(), 'site.repository does not match the deployment repository.');
assert.equal(new URL(site.url).origin.toLowerCase(), `https://${owner.toLowerCase()}.github.io`, 'Configure the matching GitHub Pages origin.');
console.log(`GitHub Pages destination verified: ${site.url}${siteBase}/`);
