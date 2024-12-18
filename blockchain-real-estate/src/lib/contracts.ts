import propertyTokenJSON from "@/../contracts/artifacts/contracts/PropertyToken.sol/PropertyToken.json";
import propertyFactoryJSON from "@/../contracts/artifacts/contracts/PropertyFactory.sol/PropertyFactory.json";
import mockEURCJSON from "@/../contracts/artifacts/contracts/MockEURC.sol/MockEURC.json";

export const propertyTokenABI = propertyTokenJSON.abi;
export const propertyFactoryABI = propertyFactoryJSON.abi;
export const mockEURCABI = mockEURCJSON.abi;

// Export contract addresses
export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;
export const MOCK_EURC_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`;

if (!PROPERTY_FACTORY_ADDRESS) {
  throw new Error('Missing NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS environment variable');
}

if (!MOCK_EURC_ADDRESS) {
  throw new Error('Missing NEXT_PUBLIC_EURC_TOKEN_ADDRESS environment variable');
}
