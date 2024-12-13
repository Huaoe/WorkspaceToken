// Import ABIs from the contracts folder
import propertyTokenJSON from '../../contracts/abis/PropertyToken.json';
import propertyFactoryJSON from '../../contracts/abis/PropertyFactory.json';
import mockEURCJSON from '../../contracts/abis/MockEURC.json';
import stakingRewardsJSON from '../../contracts/abis/StakingRewards.json';
import stakingFactoryJSON from '../../contracts/abis/StakingFactory.json';

// Export ABIs
export const propertyTokenABI = propertyTokenJSON.abi;
export const propertyFactoryABI = propertyFactoryJSON.abi;
export const mockEURCABI = mockEURCJSON.abi;
export const stakingRewardsABI = stakingRewardsJSON.abi;
export const stakingFactoryABI = stakingFactoryJSON.abi;

// Export contract addresses
export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
export const STAKING_REWARDS_ADDRESS = process.env.NEXT_PUBLIC_STAKING_REWARDS_ADDRESS;
export const STAKING_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
