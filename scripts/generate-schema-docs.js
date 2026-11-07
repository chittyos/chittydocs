#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';

// Renderer only: the caller must authenticate the upstream manifest and hashes.
const DRAFT='https://json-schema.org/draft/2020-12/schema';
const PLANES=new Set(['Identity (TY)','Connectivity (VY)','Authority (RY)']);
const ENTITIES=new Set(['Person (P)','Location (L)','Thing (T)','Event (E)','Authority (A)']);
const escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escMd=s=>String(s).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ').replace(/[<>]/g,c=>c==='<'?'&lt;':'&gt;');
function parseArgs(args){
 const opts={schemaDir:'docs/reference/schemas',outputDir:'docs/reference/api'};
 for(let i=0;i<args.length;i++){
  const a=args[i];
  if(!['--schema-dir','--output-dir'].includes(a)||!args[i+1]||args[i+1].startsWith('--')) throw Error('Expected --schema-dir DIR --output-dir DIR');
  opts[a==='--schema-dir'?'schemaDir':'outputDir']=args[++i];
 }
 return opts;
}
async function walk(dir){
 const names=(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
 let files=[];
 for(const n of names){
  const p=path.join(dir,n.name);
  if(n.isSymbolicLink())throw Error('Symlink input forbidden: '+p);
  if(n.isDirectory()) files.push(...await walk(p));
  else if(n.isFile()&&n.name.endsWith('.json')&&n.name!=='manifest.json')files.push(p);
 }
 return files;
}
function taxonomy(s){
 const plane=s['x-chitty-fractal-plane']||'Unclassified';
 const entity=s['x-chitty-entity-type']||'Unclassified';
 if(plane!=='Unclassified'&&!PLANES.has(plane))throw Error('Unknown declared plane');
 if(entity!=='Unclassified'&&!ENTITIES.has(entity))throw Error('Unknown declared entity type');
 return {plane,entity};
}
function propertyRows(s,prefix='',depth=0,out=[]){
 if(depth>12)throw Error('Exceeded nesting limit');
 const obj=s.properties||{};
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Malformed properties');
 const required=new Set(s.required||[]);
 for(const name of Object.keys(obj).sort()){
  const p=obj[name];
  if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Malformed property');
  const full=prefix?prefix+'.'+name:name;
  const type=p.$ref?'reference':Array.isArray(p.type)?p.type.join(' | '):(p.type|| (p.properties?'object':'schema'));
  const keys=['format','pattern','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','minLength','maxLength','minItems','maxItems','uniqueItems','enum','const','default','$ref','additionalProperties','oneOf','anyOf','allOf'];
  const constraints=keys.filter(k=>p[k]!==undefined).map(k=>k+': '+JSON.stringify(p[k])).join('; ')||'—';
  out.push([full,type,required.has(name)?'Yes':'No',constraints,p.description||'—']);
  if(out.length>10000)throw Error('Too many properties');
  if(p.properties)propertyRows(p,full,depth+1,out);
 }
 return out;
}
export function render(schema,relativePath){
 if(!schema||typeof schema!=='object'||Array.isArray(schema)||schema.$schema!==DRAFT||typeof schema.$id!=='string'||!schema.$id.startsWith('https://'))
  throw Error('Expected Draft 2020-12 schema with HTTPS $id');
 const t=taxonomy(schema);
 const title=schema.title||path.basename(relativePath,'.json');
 const service=schema['x-chitty-service']||'Unverified';
 const description=schema.description||'No source description';
 const source=schema.$id;
 const raw=JSON.stringify(schema,null,2);
 const fence='~~~~';
 const rows=propertyRows(schema).map(r=>'| '+r.map(escMd).join(' | ')+' |');
 return [
  '<!-- GENERATED: derived projection; NOT verified or certified by renderer -->',
  '---',
  'title: '+JSON.stringify(title),
  'description: '+JSON.stringify(description),
  'canonical_uri: '+JSON.stringify(source),
  'service: '+JSON.stringify(service),
  'fractal_plane: '+JSON.stringify(t.plane),
  'entity_class: '+JSON.stringify(t.entity),
  'verification_status: "UNVERIFIED_BY_RENDERER"',
  '---','',
  '<div data-pagefind-body data-pagefind-filter="service:'+escHtml(service)+'" data-pagefind-meta="canonical_uri:'+escHtml(source)+'">',
  '','# '+escMd(title),'',escMd(description),'',
  '**Schema ID:** '+escMd(source),'',
  '**Service:** '+escMd(service)+' · **Plane:** '+escMd(t.plane)+' · **Entity:** '+escMd(t.entity),'',
  '**Verification:** Manifest signatures, schema hashes and ledger anchors must be independently checked upstream.','',
  '## Properties','',
  '| Property | Type | Required | Constraints | Description |',
  '| --- | --- | --- | --- | --- |',...rows,
  ...(rows.length?[]:['','No declared properties.']),
  '','## Raw Draft 2020-12 schema','',
  fence+'json',raw,fence,'','</div>',''
 ].join('\n');
}
export async function generate(schemaDir,outputDir){
 const root=path.resolve(schemaDir),target=path.resolve(outputDir);
 if(root===target||root.startsWith(target+path.sep)||target.startsWith(root+path.sep))throw Error('Input/output must be disjoint');
 const stat=await fs.lstat(root);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Input must be a real directory');
 const files=await walk(root);
 if(!files.length)throw Error('No JSON schemas found');
 const pages=[];
 for(const file of files){
  const relative=path.relative(root,file);
  const raw=await fs.readFile(file,'utf8');
  if(Buffer.byteLength(raw)>2000000)throw Error('Schema exceeds size limit: '+relative);
  pages.push({name:relative.replace(/\.json$/,'.md'),value:render(JSON.parse(raw),relative)});
 }
 // Do not modify output unless all inputs parse and render successfully.
 await fs.mkdir(target,{recursive:true});
 for(const page of pages){
  const filename=path.join(target,page.name);
  await fs.mkdir(path.dirname(filename),{recursive:true});
  const prior=await fs.readFile(filename,'utf8').catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
  if(prior!==page.value)await fs.writeFile(filename,page.value,'utf8');
 }
 return pages.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const a=parseArgs(process.argv.slice(2));
 generate(a.schemaDir,a.outputDir).then(n=>console.log('Generated '+n+' pages; upstream verification not performed'))
  .catch(e=>{console.error(e.message);process.exitCode=1;});
}
