export type UserId = string;
export type PostId = string;
export type ProductId = string;

export type PrivacyLevel = 'public' | 'followers' | 'private';

export interface UserProfile {
  id: UserId;
  handle: string;
  displayName: string;
  bio: string;
  privacy: PrivacyLevel;
  shopEnabled: boolean;
}

export interface Post {
  id: PostId;
  authorId: UserId;
  text: string;
  createdAt: string;
  topics: string[];
  mediaKind: 'none' | 'image' | 'video';
  commentsCount: number;
  likesCount: number;
  savesCount: number;
}

export interface Product {
  id: ProductId;
  sellerId: UserId;
  title: string;
  priceMinor: number;
  currency: string;
  inventory: number;
  status: 'draft' | 'active' | 'sold_out' | 'archived';
}

export interface CartLine {
  productId: ProductId;
  quantity: number;
}

export interface FeedCandidateFeatures {
  relevance: number;
  relationship: number;
  quality: number;
  freshness: number;
  meaningfulInteraction: number;
  novelty: number;
  diversityContribution: number;
  creatorExposureBalance: number;
  safety: number;
  negativeFeedbackRisk: number;
}
