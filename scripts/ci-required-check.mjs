import {spawnSync} from 'node:child_process';
const checks=[
  ['i18n','node',['scripts/ci-i18n-coverage.mjs']],
  ['typecheck','npm',['run','typecheck']],
  ['expo-doctor','npx',['expo-doctor@latest']],
];
for(const [name,cmd,args] of checks){
  const r=spawnSync(cmd,args,{stdio:'inherit',shell:false});
  if(r.status!==0)process.exit(r.status??1);
  console.log(`${name}: OK`);
}
console.log('Required app checks: OK');
