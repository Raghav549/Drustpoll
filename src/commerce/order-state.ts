export type OrderState =
  | 'cart'
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancel_requested'
  | 'cancelled'
  | 'refunded';

const transitions: Record<OrderState, readonly OrderState[]> = {
  cart: ['pending_payment'],
  pending_payment: ['paid', 'cart'],
  paid: ['processing', 'cancel_requested'],
  processing: ['shipped', 'cancel_requested'],
  shipped: ['delivered', 'cancel_requested'],
  delivered: ['cancel_requested'],
  cancel_requested: ['cancelled', 'processing', 'shipped'],
  cancelled: ['refunded'],
  refunded: [],
};

export function canTransitionOrder(from: OrderState, to: OrderState): boolean {
  return transitions[from].includes(to);
}
