import { api } from './client';
export type Order={orderId:string;sellerId:string;totalMinor:number;currency:string;status:string;createdAt:string;updatedAt:string;items:any[]};
export type SellerProduct={id:string;title:string;description?:string;price_minor:number;currency:string;inventory:number;category?:string|null;status:string};
export async function getCart(){return api<any>('/v1/cart');}
export async function addCartItem(productId:string,quantity:number,variantId?:string){return api<any>('/v1/cart/items',{method:'POST',body:JSON.stringify({productId,quantity,variantId})});}
export async function updateCartItem(productId:string,quantity:number,variantId?:string){return api<any>('/v1/cart/items',{method:'PATCH',body:JSON.stringify({productId,quantity,variantId})});}
export async function getSavedForLater(){return api<any>('/v1/commerce/saved-for-later');}
export async function setSavedForLater(productId:string,quantity:number,saved:boolean){return api<any>(`/v1/commerce/products/${encodeURIComponent(productId)}/saved-for-later`,{method:saved?'POST':'DELETE',body:JSON.stringify({quantity})});}
export async function getOrders(limit=30,before?:string){return api<{orders:Order[];nextBefore:string|null}>(`/v1/orders?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getOrder(orderId:string){return api<any>(`/v1/orders/${encodeURIComponent(orderId)}`);}
export async function getAdvancedOrder(orderId:string){return api<any>(`/v1/commerce/orders/${encodeURIComponent(orderId)}`);}
export async function cancelOrder(orderId:string){return api<any>(`/v1/orders/${encodeURIComponent(orderId)}/cancel`,{method:'POST'});}
export async function requestReturn(orderId:string,reason:string,notes=''){return api<any>(`/v1/market/orders/${encodeURIComponent(orderId)}/returns`,{method:'POST',body:JSON.stringify({reason,notes})});}
export async function requestExchange(orderId:string,productId:string,notes=''){return api<any>(`/v1/commerce/orders/${encodeURIComponent(orderId)}/exchange`,{method:'POST',body:JSON.stringify({productId,notes})});}
export async function reportOrderIssue(orderId:string,issueType:string,details=''){return api<any>(`/v1/commerce/orders/${encodeURIComponent(orderId)}/issues`,{method:'POST',body:JSON.stringify({issueType,details})});}
export async function openOrderSupport(orderId:string,subject:string){return api<any>(`/v1/market/orders/${encodeURIComponent(orderId)}/support`,{method:'POST',body:JSON.stringify({subject})});}
export async function createProductReview(productId:string,input:any){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/reviews`,{method:'POST',body:JSON.stringify(input)});}
export async function askProductQuestion(productId:string,question:string){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/questions`,{method:'POST',body:JSON.stringify({question})});}
export async function getMarketCategories(){return api<any>('/v1/market/categories');}
export async function getMarketProducts(params:any={}){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')q.set(k,String(v));});return api<any>(`/v1/market/products?${q.toString()}`);}
export async function getMarketProductDetail(productId:string){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}`);}
export async function getCommerceProduct(productId:string){return getMarketProductDetail(productId);}
export async function getSavedProducts(limit=50,before?:string){return api<any>(`/v1/market/saved-products?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function setProductWishlist(productId:string,saved:boolean){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/wishlist`,{method:saved?'POST':'DELETE'});}
export async function getRelatedProducts(productId:string,limit=12){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/related?limit=${limit}`);}
export async function getAddresses(){return api<any>('/v1/market/addresses');}
export async function saveAddress(input:any){return api<any>('/v1/market/addresses',{method:'POST',body:JSON.stringify(input)});}
export async function getDeliveryEstimate(productId:string,addressId?:string){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/delivery${addressId?`?addressId=${encodeURIComponent(addressId)}`:''}`);}
export async function getSellerProducts(){return api<{products:SellerProduct[]}>('/v1/shop/products');}
export async function createSellerProduct(input:any){return api<any>('/v1/shop/products',{method:'POST',body:JSON.stringify(input)});}
export async function getSellerCommerceSettings(shopId:string){return api<any>(`/v1/seller/shops/${encodeURIComponent(shopId)}/commerce-settings`);}
export async function updateSellerCommerceSettings(shopId:string,input:any){return api<any>(`/v1/seller/shops/${encodeURIComponent(shopId)}/commerce-settings`,{method:'PUT',body:JSON.stringify(input)});}
export async function getShopRecommendations(){return api<any>('/v1/shop/recommended');}
export async function recordCommerceEvent(input:any){return api<any>('/v1/shop/events',{method:'POST',body:JSON.stringify(input)});}
