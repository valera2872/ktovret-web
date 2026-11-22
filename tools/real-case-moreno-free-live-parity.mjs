#!/usr/bin/env node
// Read-only LIVE parity check. Abort release if Beget has drifted from the
// owner's downloaded current-version HTML (Nov 19). No deployment.
import {createHash} from 'node:crypto';
const url='https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/';
const expected='254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea';
const response=await fetch(url,{headers:{'cache-control':'no-cache','user-agent':'MysteryLogic-ReleaseQA/1.0'},signal:AbortSignal.timeout(18000)});
if(!response.ok)throw new Error('LIVE page not fetchable: HTTP '+response.status);
const bytes=Buffer.from(await response.arrayBuffer());
const sha=createHash('sha256').update(bytes).digest('hex');
console.log('LIVE page verified URL',url,'length',bytes.length,'sha256',sha,'expected',expected);
if(sha!==expected)throw new Error('Beget LIVE page differs from owner-supplied Beget snapshot. Do not release old-baseline patch without reconciling current LIVE.');
console.log('PASS exact LIVE HTML parity with Beget owner snapshot');
