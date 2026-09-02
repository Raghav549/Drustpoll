export type HapticIntent='reversible'|'committed'|'error';
export function feedbackIntensity(intent:HapticIntent):'none'|'light'|'medium'{
  if(typeof navigator!=='undefined'&&'vibrate' in navigator)return 'light';
  return intent==='committed'?'medium':intent==='error'?'light':'none';
}

export function announceAction(message:string){
  if(typeof document==='undefined')return;
  let node=document.getElementById('drustpoll-live-region');
  if(!node){node=document.createElement('div');node.id='drustpoll-live-region';node.setAttribute('aria-live','polite');node.setAttribute('aria-atomic','true');node.style.position='absolute';node.style.width='1px';node.style.height='1px';node.style.overflow='hidden';node.style.clip='rect(0 0 0 0)';document.body.appendChild(node);}
  node.textContent=message;
}
