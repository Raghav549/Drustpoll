import { config } from './config.js';
import type { MultimodalExtractor } from './recommendation-feature-worker.js';

async function call(path:string,payload:unknown){
  if(!config.extraction.endpoint)throw new Error('MULTIMODAL_EXTRACTOR_NOT_CONFIGURED');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),config.extraction.timeoutMs);
  try{
    const response=await fetch(`${config.extraction.endpoint.replace(/\/$/,'')}/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...(config.extraction.apiKey?{Authorization:`Bearer ${config.extraction.apiKey}`}:{})},body:JSON.stringify(payload),signal:controller.signal});
    const text=await response.text();let data:unknown={};try{data=text?JSON.parse(text):{};}catch{throw new Error('EXTRACTOR_INVALID_JSON');}
    if(!response.ok)throw new Error(`EXTRACTOR_HTTP_${response.status}`);
    if(!data||typeof data!=='object')throw new Error('EXTRACTOR_INVALID_RESPONSE');
    return data as Record<string,unknown>;
  }finally{clearTimeout(timer);}
}

export const httpMultimodalExtractor:MultimodalExtractor={
  extractText:input=>call('text',input),
  extractImage:input=>call('image',input),
  extractAudio:input=>call('audio',input),
  extractVideo:input=>call('video',input),
  fuse:input=>call('fuse',input),
};
