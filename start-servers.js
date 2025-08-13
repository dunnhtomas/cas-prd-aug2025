const { spawn } = require('child_process');
const path = require('path');

function runNode(script, name, cwd){
  const cmd = `"${process.execPath}" ${script}`;
  return spawn(cmd, { cwd, stdio:'pipe', shell:true });
}
function runWeb(port){
  const cmd = `npx next dev -p ${port}`;
  return spawn(cmd, { cwd: path.join(__dirname,'web'), stdio:'pipe', shell:true });
}

function attach(child, name, restart){
  child.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[${name}][err] ${d}`));
  child.on('close', code => {
    console.log(`[${name}] exited ${code}`);
    if(restart) restart(code);
  });
}

// tracker
attach(runNode('tracker/index.js','tracker', __dirname), 'tracker');

let webPort = 3000;
function startWeb(){
  const child = runWeb(webPort);
  attach(child,'web', code => {
    if(code === 0){
      // If exited immediately due to port in use, try next port
      webPort += 1;
      if(webPort < 3010){
        console.log(`[web] retrying on port ${webPort}`);
        startWeb();
      }
    }
  });
}
startWeb();
