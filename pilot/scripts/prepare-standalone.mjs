import { cp,access } from 'node:fs/promises';
await access('.next/standalone/server.js');
await cp('.next/static','.next/standalone/.next/static',{recursive:true});
await cp('public','.next/standalone/public',{recursive:true});
console.log('Standalone server and browser assets prepared. Private data and environment files are not copied.');
