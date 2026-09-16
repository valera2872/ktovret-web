#!/usr/bin/env node
import path from 'node:path';
import {applyApprovedAi01} from './ai01-approved-release.mjs';

const siteRoot=path.resolve(process.argv[2]||'.');
const result=applyApprovedAi01(siteRoot,process.cwd());
console.log(JSON.stringify(result,null,2));
