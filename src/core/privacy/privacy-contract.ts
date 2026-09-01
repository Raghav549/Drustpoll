export type ProfileVisibility = 'public' | 'followers' | 'private';
export type ActivityVisibility = 'everyone' | 'followers' | 'only_me';
export type Discoverability = 'discoverable' | 'hidden';

export type PrivacySettings = {
  profile: ProfileVisibility;
  activity: ActivityVisibility;
  discoverability: Discoverability;
  messageRequests: 'everyone' | 'followers' | 'nobody';
  personalizedRecommendations: boolean;
  personalizedAds: boolean;
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile: 'public',
  activity: 'followers',
  discoverability: 'discoverable',
  messageRequests: 'followers',
  personalizedRecommendations: true,
  personalizedAds: false,
};

export type PrivacyAuditEvent = {
  actorId: string;
  subjectId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  allowed: boolean;
  timestamp: number;
};
