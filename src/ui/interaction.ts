export type InteractionState = 'idle'|'focused'|'pressed'|'pending'|'success'|'error'|'recovered'|'disabled'|'selected'|'unavailable'|'permission-denied'|'offline'|'private'|'blocked'|'muted'|'deleted'|'moderated'|'expired';
export type ActionOutcome<T=unknown>={state:'success';data:T}|{state:'error';message:string};
export async function runAction<T>(work:()=>Promise<T>):Promise<ActionOutcome<T>>{try{return {state:'success',data:await work()};}catch(error){return {state:'error',message:error instanceof Error?error.message:'Something went wrong'};}}
