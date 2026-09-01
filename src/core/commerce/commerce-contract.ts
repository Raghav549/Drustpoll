export type ProductId = string;
export type OrderId = string;

export type Product = {
  id: ProductId;
  sellerId: string;
  title: string;
  description: string;
  priceMinor: number;
  currency: string;
  inventory: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
};

export type CartLine = {
  productId: ProductId;
  quantity: number;
  unitPriceMinor: number;
};

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type Order = {
  id: OrderId;
  buyerId: string;
  sellerId: string;
  lines: CartLine[];
  totalMinor: number;
  currency: string;
  status: OrderStatus;
  createdAt: number;
};

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
