import artifact from './DecentralizedVoting.json';
import deployedConfig from './deployedAddress.json';

export const DECENTRALIZED_VOTING_ABI = artifact.abi;
export const CONTRACT_BYTECODE = artifact.bytecode;
export const DEFAULT_CONTRACT_ADDRESS = deployedConfig.contractAddress || "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
