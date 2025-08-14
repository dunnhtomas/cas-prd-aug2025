#!/usr/bin/env node
/* Cross-platform verification script: starts tracker + web, waits for readiness, runs Playwright, tears down. */
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const net = require('net');

let WEB_PORT = parseInt(process.env.WEB_PORT || '3000', 10);
let TRACKER_PORT = parseInt(process.env.TRACKER_PORT || '8080', 10);
const TIMEOUT_MS = parseInt(process.env.VERIFY_TIMEOUT_MS || '40000', 10);

let trackerProc, webProc;

function log(msg){ console.log(`[verify] ${msg}`); }

function kill(proc){
  if(proc && proc.pid){
    try {
      if(process.platform === 'win32'){
        execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio:['ignore','ignore','ignore'] });
      } else {
        try { process.kill(-proc.pid, 'SIGKILL'); } catch(_e) {}
        try { proc.kill('SIGKILL'); } catch(_e) {}
      }
    } catch(_e) {}
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
  return spawn(process.execPath, args, { cwd, stdio:'inherit', detached: true });
}

async function isPortBusy(port){
  return await new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', (err) => {
        if (err && err.code === 'EADDRINUSE') resolve(true);
        else resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port, '127.0.0.1');
  });
}

function killOnPort(port){
  try {
    if(process.platform === 'win32'){
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`, { stdio:'inherit', shell:true });
    } else {
      try { execSync(`lsof -ti :${port} -sTCP:LISTEN | xargs -r kill -9`, { stdio:'inherit' }); } catch(_e) {}
      try { execSync(`fuser -k ${port}/tcp`, { stdio:'ignore' }); } catch(_e) {}
      try {
        const cmd = `sh -c "PIDS=\$(ss -lptnH sport = :${port} | awk '{print $7}' | sed 's/pid=\\([0-9]*\\),.*/\\1/' | sort -u); [ -n \"$PIDS\" ] && kill -9 $PIDS || true"`;
        execSync(cmd, { stdio:'ignore' });
      } catch(_e) {}
    }
  } catch (_e) {}
}

async function waitPortFreed(port){
  const deadline = Date.now() + 5000;
  while(Date.now() < deadline){
    // eslint-disable-next-line no-await-in-loop
    const busy = await isPortBusy(port);
    if(!busy) return true;
    await new Promise(r=> setTimeout(r, 250));
  }
  return false;
}

async function main(){
  // Free required ports to keep canonical/health expectations stable
  if(await isPortBusy(TRACKER_PORT)) { log(`Killing processes on ${TRACKER_PORT}`); killOnPort(TRACKER_PORT); await waitPortFreed(TRACKER_PORT); }
  if(await isPortBusy(WEB_PORT)) { log(`Killing processes on ${WEB_PORT}`); killOnPort(WEB_PORT); await waitPortFreed(WEB_PORT); }

  log(`Starting tracker on ${TRACKER_PORT}`);
  process.env.TRACKER_PORT = String(TRACKER_PORT);
  trackerProc = spawnNode(['tracker/index.js'], __dirname);

  log(`Starting web on ${WEB_PORT}`);
  webProc = spawn('npx', ['next','dev','-p', String(WEB_PORT)], { cwd: path.join(__dirname,'web'), stdio:'inherit', shell: process.platform === 'win32', detached: true });

  log('Waiting for web...');
  await waitHttp(`http://localhost:${WEB_PORT}`);
  log('Waiting for tracker health...');
  await waitHttp(`http://localhost:${TRACKER_PORT}/health`);

  // Ensure browsers via npm pretest hook
  log('Installing Playwright browsers...');
  execSync('npx playwright install', { stdio:'inherit' });

  log('Running Playwright tests');
  process.env.WEB_URL = `http://localhost:${WEB_PORT}`;
  process.env.TRACKER_URL = `http://localhost:${TRACKER_PORT}`;

  await new Promise((resolve,reject)=>{
    const pw = spawn('npm',['test'], { stdio:'inherit', shell: process.platform === 'win32' });
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
