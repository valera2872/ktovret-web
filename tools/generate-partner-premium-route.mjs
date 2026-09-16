#!/usr/bin/env node
import path from 'node:path';
import { applyPartnerPremiumNePublikovat } from './import-mobile/partner-premium-ne-publikovat-postprocess.mjs';

const tokens = process.argv.slice(2);
const siteArg = tokens.indexOf('--site');
const siteRoot = path.resolve(siteArg >= 0 && tokens[siteArg + 1] ? tokens[siteArg + 1] : '.');
const result = applyPartnerPremiumNePublikovat(siteRoot);
console.log(JSON.stringify(result));
