export interface PropertyRequest {
  id: number;
  user_id: string;
  property_address: string;
  property_name: string;
  property_description: string;
  property_image: string | null;
  property_value: number;
  property_token_address: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
