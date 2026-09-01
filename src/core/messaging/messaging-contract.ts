export type ConversationId = string;
export type MessageId = string;

export type Conversation = {
  id: ConversationId;
  participantIds: string[];
  createdAt: number;
  lastMessageAt?: number;
};

export type EncryptedMessage = {
  id: MessageId;
  conversationId: ConversationId;
  senderId: string;
  ciphertext: string;
  keyVersion: number;
  createdAt: number;
  deliveredAt?: number;
  readAt?: number;
};

export type DeviceKeyBundle = {
  userId: string;
  deviceId: string;
  identityKey: string;
  signedPreKey: string;
  preKeySignatures: string[];
  createdAt: number;
};

// Private-message content is represented as ciphertext at the transport boundary.
// Server-side authorization, metadata minimization, device revocation and key rotation
// remain mandatory; end-to-end encryption is not claimed for commerce/order data.
