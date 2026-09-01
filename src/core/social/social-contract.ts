export type UserId = string;
export type PostId = string;

export type FollowState = 'requested' | 'following' | 'blocked' | 'none';
export type PostVisibility = 'public' | 'followers' | 'private';

export type SocialProfile = {
  userId: UserId;
  handle: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  visibility: 'public' | 'private';
};

export type Post = {
  id: PostId;
  authorId: UserId;
  caption: string;
  media: Array<{ type: 'image' | 'video'; uri: string; alt?: string }>;
  visibility: PostVisibility;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
};

export type Relationship = {
  actorId: UserId;
  targetId: UserId;
  state: FollowState;
  createdAt?: number;
};
