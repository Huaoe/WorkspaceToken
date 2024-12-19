export interface BasePropertyRequest {
  id: string;
  created_at: string;
  owner_address: string;
  title: string;
  description: string;
  location: string;
  image_url?: string;
  expected_price: number;
  documents_url?: string;
  latitude: number;
  longitude: number;
  number_of_tokens?: number;
  approved_at?: string;
  rejected_at?: string;
  tokenized_at?: string;
}

export interface PendingPropertyRequest extends BasePropertyRequest {
  status: 'pending' | 'approved' | 'rejected';
  token_address?: string;
}

export interface OnChainPropertyRequest extends BasePropertyRequest {
  status: 'onchain' | 'funding';
  token_address: string; 
}

export interface PropertyRequest {
  documents_url: string | null;
  id?: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  expected_price: number;
  ownerAddress: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  payoutDuration: Date;
  finishAt: Date;
  roi: number;
  latitude?: number;
  longitude?: number;
}

export interface PropertyRequestFormData {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  expected_price: number;
  payoutDuration: Date;
  finishAt: Date;
  roi: number;
}

export type PropertyRequestType = PendingPropertyRequest | OnChainPropertyRequest;
