import fs from 'node:fs/promises';
import path from 'node:path';
async function files(dir){const found=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())found.push(...await files(p));else found.push(p);}return found;}
const secrets=[process.env.FEEDBACK_SECRET,process.env.JUPITER_API_KEY,...(process.env.PILOT_TESTER_CODES||'').split(',')].filter(s=>s&&s.length>=8);
// Check the RPC credential as well; never print the URL or the credential itself.
try{const key=new URL(process.env.SOLANA_RPC_URL||'').searchParams.get('api-key');if(key&&key.length>=8)secrets.push(key);}catch{}
const browserFiles=await files('.next/static');let leaks=0;
for(const p of browserFiles){const bytes=await fs.readFile(p);for(const s of secrets)if(bytes.includes(Buffer.from(s)))leaks++;}
const standalone=await fs.readdir('.next/standalone');
const privateArtifacts=standalone.filter(n=>n==='.pilot-feedback'||n==='.env.local'||n==='.env.production'||n==='evidence'||n==='var');
const result={browserFilesScanned:browserFiles.length,configuredSecretValuesChecked:secrets.length,secretValueMatches:leaks,privateArtifactsCopied:privateArtifacts.length};
console.log(JSON.stringify(result,null,2));if(leaks||privateArtifacts.length)process.exitCode=1;
