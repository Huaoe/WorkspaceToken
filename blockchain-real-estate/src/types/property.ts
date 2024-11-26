export interface PropertyRequest {
  id: string;
  created_at: string;
  owner_address: string;
  title: string;
  description: string;
  location: string;
  image_url?: string;
  expected_price: number;
  documents_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'onchain';
  latitude: number;
  longitude: number;
  number_of_tokens?: number;
  approved_at?: string;
  rejected_at?: string;
  tokenized_at?: string;
  token_address?: string
}
