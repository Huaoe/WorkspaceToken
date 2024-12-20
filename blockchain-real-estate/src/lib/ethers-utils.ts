import { ethers } from 'ethers';

export const getEthersProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No ethereum provider available');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

export const getEthersContract = async (
  address: string,
  abi: any,
  signerOrProvider?: ethers.Provider | ethers.Signer
) => {
  const provider = signerOrProvider || await getEthersProvider();
  return new ethers.Contract(address, abi, provider);
};

export const getEthersSigner = async () => {
  try {
    const provider = await getEthersProvider();
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    throw error;
  }
};
