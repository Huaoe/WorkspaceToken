import propertyTokenJSON from "@/../contracts/artifacts/contracts/PropertyToken.sol/PropertyToken.json";
import propertyFactoryJSON from "@/../contracts/artifacts/contracts/PropertyFactory.sol/PropertyFactory.json";

export const propertyTokenABI = propertyTokenJSON.abi;
export const propertyFactoryABI = propertyFactoryJSON.abi;

// Export contract addresses
export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;
if (!PROPERTY_FACTORY_ADDRESS) {
  throw new Error('Missing NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS environment variable');
}
