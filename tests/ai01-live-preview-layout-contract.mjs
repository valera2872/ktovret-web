import fs from 'node:fs';
import assert from 'node:assert/strict';

const admin=fs.readFileSync('admin/ai01-live-preview/index.html','utf8');
const css=fs.readFileSync('assets/review-admin.css','utf8');

assert.match(admin,/class="mla-app ai01-preview-app"/,'AI-01 owner preview app shell must remain identifiable');
assert.match(admin,/class="ai01-preview-frame"[^>]+data-preview-frame/,'AI-01 owner preview iframe must remain identifiable');
assert.match(css,/@media\(min-width:761px\)\{[^}]*\.mla-body\.ai01-preview-open \.mla-shell\{display:flex!important;flex-direction:column!important;height:100dvh!important;min-height:0!important\}/s,'desktop AI-01 owner preview must use a definite flex viewport instead of a cyclic iframe grid height');
assert.match(css,/\.mla-body\.ai01-preview-open \.ai01-preview-app\{display:flex!important;flex-direction:column!important;flex:1 1 0!important;height:0!important;min-height:0!important/s,'owner preview app must consume the remaining viewport as a flex column');
assert.match(css,/\.mla-body\.ai01-preview-open \.ai01-preview-frame\{display:block!important;flex:1 1 0!important;height:0!important;min-height:0!important;max-height:none!important;align-self:stretch!important\}/s,'owner preview iframe must be forced to consume remaining flex space instead of its intrinsic 150px height');
console.log('AI-01 Live preview flex layout contract: ok');
