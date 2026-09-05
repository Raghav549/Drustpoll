const fs=require('fs');const path=require('path');
const roots=['app','src'];const replacement="({position:'absolute',top:0,left:0,right:0,bottom:0} as const)";
function walk(dir){if(!fs.existsSync(dir))return;for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);const stat=fs.statSync(file);if(stat.isDirectory())walk(file);else if(/\.(ts|tsx)$/.test(name)){const before=fs.readFileSync(file,'utf8');const after=before.replace(/StyleSheet\.absoluteFillObject/g,replacement);if(after!==before)fs.writeFileSync(file,after);}}}
for(const root of roots)walk(path.resolve(root));
