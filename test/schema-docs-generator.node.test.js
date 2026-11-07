import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {render,generate} from '../scripts/generate-schema-docs.js';

const valid=()=>({
 $schema:'https://json-schema.org/draft/2020-12/schema',
 $id:'https://schema.chitty.cc/schemas/test/receipt.json',
 title:'Execution Receipt',
 description:'A signed receipt & <untrusted> string',
 'x-chitty-fractal-plane':'Connectivity (VY)',
 'x-chitty-entity-type':'Event (E)',
 'x-chitty-service':'chittytasks',
 type:'object',
 required:['trace_id'],
 properties:{
  trace_id:{type:'string',description:'Trace | identifier',pattern:'^[a-z]+$'},
  attempts:{type:'integer',minimum:0,default:0},
  nested:{type:'object',required:['time'],properties:{time:{type:'string',format:'date-time'}}},
  status:{enum:['SUCCESS','FAILED']}
 }
});
test('render preserves authoritative declared tags and all property constraints',()=>{
 const text=render(valid(),'chittytasks/receipt.json');
 assert.match(text,/Connectivity \(VY\)/);
 assert.match(text,/Event \(E\)/);
 assert.match(text,/\| trace_id \| string \| Yes \|/);
 assert.match(text,/\| nested\.time \| string \| Yes \|/);
 assert.match(text,/format: "date-time"/);
 assert.match(text,/default: 0/);
 assert.match(text,/Trace \\| identifier/);
 assert.match(text,/&lt;untrusted&gt;/);
 assert.match(text,/UNVERIFIED_BY_RENDERER/);
});
test('missing taxonomy is unclassified, never inferred from name',()=>{
 const obj=valid();delete obj['x-chitty-entity-type'];delete obj['x-chitty-fractal-plane'];
 const text=render(obj,'identity/agent-key.json');
 assert.match(text,/Unclassified/);
});
test('reject wrong schema version and unsupported taxonomy',()=>{
 const obj=valid();obj.$schema='http://json-schema.org/draft-07/schema#';
 assert.throws(()=>render(obj,'x.json'),/Draft 2020-12/);
 obj.$schema='https://json-schema.org/draft/2020-12/schema';
 obj['x-chitty-entity-type']='Agent (A)';
 assert.throws(()=>render(obj,'x.json'),/Unknown declared/);
});
test('generation deterministic and non-overwriting for unchanged content',async t=>{
 const work=await fs.mkdtemp(path.join(os.tmpdir(),'chittydocs-schemas-'));t.after(()=>fs.rm(work,{recursive:true,force:true}));
 const src=path.join(work,'src'),dest=path.join(work,'out');
 await fs.mkdir(path.join(src,'chittytasks'),{recursive:true});
 await fs.writeFile(path.join(src,'chittytasks','receipt.json'),JSON.stringify(valid()));
 assert.equal(await generate(src,dest),1);
 const file=path.join(dest,'chittytasks','receipt.md');
 const first=await fs.readFile(file,'utf8');
 assert.equal(await generate(src,dest),1);
 assert.equal(await fs.readFile(file,'utf8'),first);
});
test('a malformed input fails closed before writing any output',async t=>{
 const work=await fs.mkdtemp(path.join(os.tmpdir(),'chittydocs-bad-'));t.after(()=>fs.rm(work,{recursive:true,force:true}));
 const src=path.join(work,'src'),dest=path.join(work,'out');
 await fs.mkdir(src);
 await fs.writeFile(path.join(src,'a.json'),JSON.stringify(valid()));
 await fs.writeFile(path.join(src,'b.json'),'{broken');
 await assert.rejects(()=>generate(src,dest),/JSON/);
 await assert.rejects(()=>fs.stat(dest),{code:'ENOENT'});
});
test('empty and overlapping input directories fail',async t=>{
 const work=await fs.mkdtemp(path.join(os.tmpdir(),'chittydocs-empty-'));t.after(()=>fs.rm(work,{recursive:true,force:true}));
 await assert.rejects(()=>generate(work,path.join(work,'out')),/disjoint/);
 await assert.rejects(()=>generate(work,os.tmpdir()),/disjoint|No JSON schemas/);
});
