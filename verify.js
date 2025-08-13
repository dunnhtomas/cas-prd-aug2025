#!/usr/bin/env node
/* Cross-platform verification script: starts tracker + web, waits for readiness, runs Playwright, tears down. */
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

let WEB_PORT = parseInt(process.env.WEB_PORT || '3000', 10);
let TRACKER_PORT = parseInt(process.env.TRACKER_PORT || '8080', 10);
const TIMEOUT_MS = parseInt(process.env.VERIFY_TIMEOUT_MS || '40000', 10);

let trackerProc, webProc;

function log(msg){ console.log(`[verify] ${msg}`); }

function kill(proc){
  if(proc && !proc.killed){
    try { proc.kill('SIGTERM'); } catch(e){}
  }
}

function waitHttp(url){
  const deadline = Date.now() + TIMEOUT_MS;
  return new Promise((resolve,reject)=>{
    const attempt=()=>{
      if(Date.now()>deadline) return reject(new Error('timeout waiting '+url));
      const req = http.get(url, res=>{
        if(res.statusCode && res.statusCode < 400){ res.resume(); return resolve(true); }
        res.resume(); setTimeout(attempt,700);
      });
      req.on('error', ()=> setTimeout(attempt,600));
    }; attempt();
  });
}

function spawnNode(args, cwd){
  return spawn(process.execPath, args, { cwd, stdio:'inherit' });
}

function portBusy(port){
  try {
    if(process.platform === 'win32'){
      const out = execSync(`netstat -ano | findstr :${port}`, { stdio:['pipe','pipe','ignore'] }).toString();
      return out.trim().length>0;
    } else {
      execSync(`lsof -i :${port}` , { stdio:['ignore','ignore','ignore'] });
      return true;
    }
  } catch { return false; }
}

function freeOrIncrement(start){
  let p = start; let tries = 0;
  while(portBusy(p) && tries < 10){ p++; tries++; }
  return p;
}

async function main(){
  TRACKER_PORT = freeOrIncrement(TRACKER_PORT);
  log(`Starting tracker on ${TRACKER_PORT}`);
  process.env.TRACKER_PORT = String(TRACKER_PORT);
  trackerProc = spawnNode(['tracker/index.js'], __dirname);

  WEB_PORT = freeOrIncrement(WEB_PORT);
  log(`Starting web on ${WEB_PORT}`);
  webProc = spawn('npx', ['next','dev','-p', String(WEB_PORT)], { cwd: path.join(__dirname,'web'), stdio:'inherit', shell: process.platform === 'win32' });

  log('Waiting for web...');
  await waitHttp(`http://localhost:${WEB_PORT}`);
  log('Waiting for tracker health...');
  await waitHttp(`http://localhost:${TRACKER_PORT}/health`);

  log('Running Playwright tests');
  process.env.WEB_URL = `http://localhost:${WEB_PORT}`;
  process.env.TRACKER_URL = `http://localhost:${TRACKER_PORT}`;

  await new Promise((resolve,reject)=>{
    const pw = spawn('npx',['playwright','test'], { stdio:'inherit', shell: process.platform === 'win32' });
    pw.on('close', code=> code===0 ? resolve(0) : reject(new Error('tests failed '+code)) );
    pw.on('error', reject);
  });
  log('Success');
}

main().then(()=>{
  kill(webProc); kill(trackerProc); process.exit(0);
}).catch(err=>{
  console.error('[verify] ERROR', err.message);
  kill(webProc); kill(trackerProc); process.exit(1);
});
