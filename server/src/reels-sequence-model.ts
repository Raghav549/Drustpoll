import { watchAffinity } from './reels-ranking.js';

export type SequenceEvent={postId:string;creatorId:string;topic?:string;format?:string;watchedMs:number;durationMs:number;replay?:number;skipped?:boolean;liked?:boolean;saved?:boolean;shared?:boolean;commented?:boolean;createdAt:number};
export type SequenceCandidate={postId:string;creatorId:string;topic?:string;format?:string;semanticSimilarity?:number;freshness?:number;quality?:number;longTail?:number;creatorExposure?:number};

const clamp=(v:number)=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const decay=(ageMs:number,halfLifeMs:number)=>Math.pow(0.5,Math.max(0,ageMs)/halfLifeMs);

/**
 * Evidence-aligned starting model: duration-normalized watch behaviour plus
 * recency-weighted creator/topic/format affinity. It is a feature contract,
 * not a claim of trained production weights; validation belongs to experiments.
 */
export function buildSequenceProfile(events:SequenceEvent[],now=Date.now()){
  const creator=new Map<string,number>();const topic=new Map<string,number>();const format=new Map<string,number>();
  for(const e of events.slice(-200)){
    const affinity=watchAffinity(e.watchedMs,e.durationMs,e.replay??0,e.skipped?1:0);
    const action=affinity*0.7+(e.liked?0.12:0)+(e.saved?0.16:0)+(e.shared?0.20:0)+(e.commented?0.18:0);
    const weight=decay(now-e.createdAt,24*60*60*1000);
    const value=clamp(action)*weight;
    creator.set(e.creatorId,(creator.get(e.creatorId)??0)+value);
    if(e.topic)topic.set(e.topic,(topic.get(e.topic)??0)+value);
    if(e.format)format.set(e.format,(format.get(e.format)??0)+value);
  }
  const normalize=(m:Map<string,number>)=>{const max=Math.max(...m.values(),1);return new Map([...m].map(([k,v])=>[k,clamp(v/max)]));};
  return {creator:normalize(creator),topic:normalize(topic),format:normalize(format)};
}

export function scoreSequenceCandidate(candidate:SequenceCandidate,profile:ReturnType<typeof buildSequenceProfile>,now=Date.now()){
  const affinity=clamp((profile.creator.get(candidate.creatorId)??0)*0.40+(candidate.topic?(profile.topic.get(candidate.topic)??0):0)*0.30+(candidate.format?(profile.format.get(candidate.format)??0):0)*0.10);
  const similarity=clamp(candidate.semanticSimilarity??0);
  const freshness=clamp(candidate.freshness??0);
  const quality=clamp(candidate.quality??0);
  const longTail=clamp(candidate.longTail??0);
  const exposureBalance=1-clamp(candidate.creatorExposure??0);
  const temporal=decay(Math.max(0,now-Date.now()),6*60*60*1000);
  return clamp(affinity*.34+similarity*.20+freshness*.12+quality*.12+longTail*.10+exposureBalance*.08)*temporal;
}
