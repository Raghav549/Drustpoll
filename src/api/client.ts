/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getSellerCommerceSettings(shopId:string){return api<any>(`/v1/seller/shops/${encodeURIComponent(shopId)}/commerce-settings`);}
export async function updateSellerCommerceSettings(shopId:string,input:any){return api<any>(`/v1/seller/shops/${encodeURIComponent(shopId)}/commerce-settings`,{method:'PUT',body:JSON.stringify(input)});}
export async function getProfessionalProfile(){return api<any>('/v1/account/professional');}
export async function updateProfessionalProfile(input:any){return api<any>('/v1/account/professional',{method:'PUT',body:JSON.stringify(input)});}
export async function getBusinessVerification(){return api<any>('/v1/business/verification');}
export async function requestBusinessVerification(input:any){return api<any>('/v1/business/verification',{method:'POST',body:JSON.stringify(input)});}
export async function getAdDeliveryControls(){return api<any>('/v1/ads/delivery-controls');}
export async function updateAdDeliveryControls(input:any){return api<any>('/v1/ads/delivery-controls',{method:'PUT',body:JSON.stringify(input)});}
export async function getAdCampaigns(){return api<any>('/v1/ads/campaigns');}
export async function createAdCampaign(input:any){return api<any>('/v1/ads/campaigns',{method:'POST',body:JSON.stringify(input)});}
export async function createAdCreative(campaignId:string,input:any){return api<any>(`/v1/ads/campaigns/${encodeURIComponent(campaignId)}/creatives`,{method:'POST',body:JSON.stringify(input)});}
export async function reportAdFeedback(creativeId:string,signal:'hide'|'not_relevant'|'report'|'why_this'){return api<any>(`/v1/ads/creatives/${encodeURIComponent(creativeId)}/feedback`,{method:'POST',body:JSON.stringify({signal})});}
