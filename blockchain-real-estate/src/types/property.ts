export interface PropertyRequest {
  id: string;
  property_type: string;
  price: number;
  area: number;
  location: string;
  latitude: number;
  longitude: number;
  owner_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'onchain';
  property_id?: string;
  created_at: string;
  description: string;
  image_url?: string;
  documents_url?: string | string[];
}
