export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  price: string;
  imageUrl: string;
  owner: string;
  status: 'pending' | 'approved' | 'rejected';
}
