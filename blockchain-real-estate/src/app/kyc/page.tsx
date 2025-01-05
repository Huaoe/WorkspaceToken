'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { useWalletEvents } from '@/app/wallet-events-provider';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'student' | 'retired';
type TradingExperience = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface KYCFormData {
  salutation: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  country_of_residence: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  identification_type: string;
  identification_number: string;
  identification_issue_date: string;
  identification_expiry_date: string;
  employment_status: EmploymentStatus;
  source_of_funds: string;
  annual_income: number;
  primary_blockchain_network: string;
  trading_experience: TradingExperience;
  purpose_of_trading: string;
}

export default function KYCForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();
  const [loading, setLoading] = useState(false);
  const [existingKYC, setExistingKYC] = useState<any>(null);

  const [formData, setFormData] = useState<KYCFormData>({
    salutation: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: new Date().toISOString().split('T')[0], // Initialize with current date
    nationality: '',
    country_of_residence: '',
    email: '',
    phone_country_code: '',
    phone_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    identification_type: '',
    identification_number: '',
    identification_issue_date: new Date().toISOString().split('T')[0], // Initialize with current date
    identification_expiry_date: new Date().toISOString().split('T')[0], // Initialize with current date
    employment_status: 'employed',
    source_of_funds: '',
    annual_income: 0,
    primary_blockchain_network: 'ethereum',
    trading_experience: 'none',
    purpose_of_trading: ''
  });

  const [files, setFiles] = useState({
    identity_proof: null as File | null,
    address_proof: null as File | null,
    additional_document: null as File | null
  });

  // Fetch existing KYC data if available
  useEffect(() => {
    if (address) {
      fetchExistingKYC();
    }
  }, [address]);

  const fetchExistingKYC = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (error) throw error;
      if (data) {
        setExistingKYC(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching KYC:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const uploadFile = async (file: File, type: string) => {
    if (!address) return null;
    
    try {
      // Create a unique file name with wallet address as folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${address}/${type}_${Date.now()}.${fileExt}`;

      // Upload the file to the kyc_documents bucket
      const { error: uploadError, data } = await supabase.storage
        .from('kyc_documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error(`Failed to get path for uploaded ${type}`);
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('kyc_documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    // Validate dates
    const dateFields = ['date_of_birth', 'identification_issue_date', 'identification_expiry_date'];
    for (const field of dateFields) {
      if (!formData[field as keyof KYCFormData]) {
        toast({
          title: "Error",
          description: `Please enter a valid ${field.replace(/_/g, ' ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Upload files
      const uploadedFiles: Record<string, string> = {};
      
      for (const [type, file] of Object.entries(files)) {
        if (file) {
          try {
            const url = await uploadFile(file, type);
            if (url) {
              uploadedFiles[`${type}_url`] = url;
            }
          } catch (error: any) {
            toast({
              title: `Error uploading ${type}`,
              description: error.message,
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
        }
      }

      // Prepare data for submission
      const submissionData = {
        ...formData,
        ...uploadedFiles,
        wallet_address: address,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      // Submit to Supabase
      const { error } = await supabase
        .from('kyc_submissions')
        .upsert(submissionData, {
          onConflict: 'wallet_address'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your KYC submission has been received and is under review.",
      });

      // Redirect to dashboard or confirmation page
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (existingKYC?.status === 'approved') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-green-800 mb-2">KYC Approved</h2>
            <p className="text-green-700">Your KYC verification has been approved. You can now access all features of the platform.</p>
          </div>
        </div>
      </div>
    );
  }

  if (existingKYC?.status === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-yellow-800 mb-2">KYC Under Review</h2>
            <p className="text-yellow-700">Your KYC submission is currently under review. We'll notify you once the verification is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="mb-6">Please connect your wallet to proceed with KYC verification.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">KYC Verification</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Salutation</label>
                <select
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country of Residence</label>
                <input
                  type="text"
                  name="country_of_residence"
                  value={formData.country_of_residence}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country Code</label>
                <input
                  type="text"
                  name="phone_country_code"
                  value={formData.phone_country_code}
                  onChange={handleInputChange}
                  placeholder="+1"
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Address Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Identification</h2>
            <div>
              <label className="block text-sm font-medium mb-1">ID Type</label>
              <select
                name="identification_type"
                value={formData.identification_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              >
                <option value="">Select...</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ID Number</label>
              <input
                type="text"
                name="identification_number"
                value={formData.identification_number}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  name="identification_issue_date"
                  value={formData.identification_issue_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="identification_expiry_date"
                  value={formData.identification_expiry_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Financial Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Employment Status</label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              >
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source of Funds</label>
              <input
                type="text"
                name="source_of_funds"
                value={formData.source_of_funds}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Annual Income (USD)</label>
              <input
                type="number"
                name="annual_income"
                value={formData.annual_income}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
          </div>

          {/* Trading Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Trading Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Primary Blockchain Network</label>
              <select
                name="primary_blockchain_network"
                value={formData.primary_blockchain_network}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="binance">Binance Smart Chain</option>
                <option value="solana">Solana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trading Experience</label>
              <select
                name="trading_experience"
                value={formData.trading_experience}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              >
                <option value="none">None</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purpose of Trading</label>
              <textarea
                name="purpose_of_trading"
                value={formData.purpose_of_trading}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Document Upload</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Identity Proof</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'identity_proof')}
                className="w-full"
                accept="image/*,.pdf"
                required={!existingKYC}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address Proof</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'address_proof')}
                className="w-full"
                accept="image/*,.pdf"
                required={!existingKYC}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Additional Document (Optional)</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'additional_document')}
                className="w-full"
                accept="image/*,.pdf"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit KYC'}
          </button>
        </form>
      </div>
    </div>
  );
}
