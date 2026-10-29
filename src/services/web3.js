import { ethers } from 'ethers';
import abi from '../data/SecureHarvest.json';

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const CONTRACT_ADDRESS = '0x7216fA8b3EA1cFb1967c8FdD3865E64C8B366751';

const provider = new ethers.JsonRpcProvider(RPC_URL);

export const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);