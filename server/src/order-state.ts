export type OrderStatus='pending_payment'|'paid'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded';
export const ORDER_TRANSITIONS:Record<OrderStatus,readonly OrderStatus[]>={pending_payment:['paid','cancelled'],paid:['processing','cancelled','refunded'],processing:['shipped','cancelled','refunded'],shipped:['delivered','refunded'],delivered:['refunded'],cancelled:[],refunded:[]};
export function canTransitionOrder(from:OrderStatus,to:OrderStatus){return ORDER_TRANSITIONS[from].includes(to);}
