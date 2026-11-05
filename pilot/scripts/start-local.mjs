import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd(),index=process.argv.indexOf('--port');
const port=index>=0?Number(process.argv[index+1]):Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid local port.');
process.env.HOSTNAME='127.0.0.1';process.env.PORT=String(port);
process.env.PILOT_FEEDBACK_DIR=path.resolve(root,process.env.PILOT_FEEDBACK_DIR||'.pilot-feedback');
process.env.PILOT_LEDGER_DIR=path.resolve(root,process.env.PILOT_LEDGER_DIR||'var/ledger');
await import(pathToFileURL(path.join(root,'.next/standalone/server.js')).href);
