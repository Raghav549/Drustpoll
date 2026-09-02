import { applyWebhook, type PaymentProvider } from './payment-service.js';

export async function handleVerifiedPaymentWebhook(provider:PaymentProvider,rawBody:string,signature:string){
  if(!rawBody||rawBody.length>1024*1024)throw new Error('Invalid webhook body');
  if(!signature||signature.length>512)throw new Error('Invalid webhook signature');
  return applyWebhook(provider,rawBody,signature);
}

export function makeHmacPaymentProvider(name:string,secret:string,transport:{createIntent(input:{orderId:string;amountMinor:number;currency:string;idempotencyKey:string}):Promise<{providerIntentId:string;status:'created'|'requires_action'|'processing'}>;parseWebhook(rawBody:string):{eventId:string;type:string;providerIntentId:string;status:'succeeded'|'failed'|'cancelled'}}):PaymentProvider{
  if(!name||!secret)throw new Error('Payment provider is not configured');
  return {name,createIntent:transport.createIntent,verifyWebhook({rawBody,signature}){return transport.parseWebhook(rawBody);}};
}
