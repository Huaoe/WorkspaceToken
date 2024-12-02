'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from 'wagmi';
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
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [existingKYC, setExistingKYC] = useState<any>(null);

  const [formData, setFormData] = useState<KYCFormData>({
    salutation: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
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
    identification_issue_date: '',
    identification_expiry_date: '',
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

      // Prepare KYC data
      const kycData = {
        ...formData,
        ...uploadedFiles,
        wallet_address: address,
      };

      // Submit to database
      const { error: dbError } = existingKYC
        ? await supabase
            .from('kyc_submissions')
            .update(kycData)
            .eq('wallet_address', address)
        : await supabase
            .from('kyc_submissions')
            .insert([kycData]);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(dbError.message);
      }

      toast({
        title: "Success",
        description: `KYC successfully ${existingKYC ? 'updated' : 'submitted'}`,
      });

      router.push('/');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to submit KYC',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="salutation"
              value={formData.salutation}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Salutation</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
            </select>
            
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="middle_name"
              placeholder="Middle Name (Optional)"
              value={formData.middle_name}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />

            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="nationality"
              placeholder="Nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="phone_country_code"
                placeholder="+1"
                value={formData.phone_country_code}
                onChange={handleInputChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="tel"
                name="phone_number"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="border p-2 rounded col-span-2"
                required
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="street_address"
              placeholder="Street Address"
              value={formData.street_address}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="state"
              placeholder="State/Province"
              value={formData.state}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="postal_code"
              placeholder="Postal Code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Identity Proof</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'identity_proof')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
                required={!existingKYC}
              />
            </div>

            <div>
              <label className="block mb-2">Address Proof</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'address_proof')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
                required={!existingKYC}
              />
            </div>

            <div>
              <label className="block mb-2">Additional Document (Optional)</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'additional_document')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Financial Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="employment_status"
              value={formData.employment_status}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Employment Status</option>
              <option value="employed">Employed</option>
              <option value="self_employed">Self Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
              <option value="retired">Retired</option>
            </select>

            <input
              type="text"
              name="source_of_funds"
              placeholder="Source of Funds"
              value={formData.source_of_funds}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              name="annual_income"
              placeholder="Annual Income"
              value={formData.annual_income}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </div>

        {/* Trading Experience */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Trading Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="trading_experience"
              value={formData.trading_experience}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Trading Experience</option>
              <option value="none">None</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            <textarea
              name="purpose_of_trading"
              placeholder="Purpose of Trading"
              value={formData.purpose_of_trading}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !isConnected}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : existingKYC ? 'Update KYC' : 'Submit KYC'}
          </button>
        </div>
      </form>
    </div>
  );
}
