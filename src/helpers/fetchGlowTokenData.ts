import * as dotenv from 'dotenv';
dotenv.config(); // Load .env file
import { GlowTokenStats, PriceData } from "../types";
import { DuneClient } from "@duneanalytics/client-sdk";
const dune = new DuneClient(process.env.DUNE_API_KEY as string || '');

import { Web3 } from 'web3';

const glowContractABI = [{"inputs":[{"internalType":"address","name":"_usdcAddress","type":"address"},{"internalType":"address","name":"_holdingContract","type":"address"},{"internalType":"address","name":"_glowToken","type":"address"},{"internalType":"address","name":"_minerPoolAddress","type":"address"}],"stateMutability":"payable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"AddressInsufficientBalance","type":"error"},{"inputs":[],"name":"AllSold","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"inputs":[],"name":"MinerPoolAlreadySet","type":"error"},{"inputs":[],"name":"ModNotZero","type":"error"},{"inputs":[],"name":"PriceTooHigh","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"TooManyIncrements","type":"error"},{"inputs":[],"name":"ZeroAddress","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"glwReceived","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalUSDCSpent","type":"uint256"}],"name":"Purchase","type":"event"},{"inputs":[],"name":"GLOW_TOKEN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"HOLDING_CONTRACT","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINER_POOL","outputs":[{"internalType":"contract IMinerPool","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_TOKEN_INCREMENT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOTAL_INCREMENTS_TO_SELL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"USDC_DECIMALS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"USDC_TOKEN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"increments","type":"uint256"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"name":"buy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getCurrentPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"incrementsToPurchase","type":"uint256"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

const GLOW_GREEN_API_BASE = process.env.GLOW_GREEN_API || '';
const GLOW_GREEN_API = `${GLOW_GREEN_API_BASE}headline-stats`;
const GLOW_PRICE_API = `${GLOW_GREEN_API_BASE}all-glow-prices`;
const GLOW_ADDRESS = '0xD5aBe236d2F2F5D10231c054e078788Ea3447DFc';

interface GlowStatsResponse {
  glowPrice: number;
  circulatingSupply: number;
  totalSupply: number;
  marketCap: number;
  allProtocolFees: {
    revenueToken: string;
    revenueUSD: string;
    date: number;
  }[];
}

async function fetchGlowPriceFromContract() {
  try {
    const web3 = new Web3(process.env.INFURA_URL as string); // Replace with your node URL
    const contract = new web3.eth.Contract(glowContractABI, GLOW_ADDRESS);

    try {
      const price = await contract.methods.getCurrentPrice().call();
      return Number(price) / 10000;
    } catch (error) {
      console.error('Error fetching price:');
      return 0; // Or handle the error gracefully
    }
  }
  catch (error) {
    console.error('Error connecting to the node:');
    return // Or handle the error gracefully
  }
}

export async function getGlowStats(): Promise<GlowTokenStats> {
  try {
    const response = await fetch(GLOW_GREEN_API);
    if (!response.ok) throw new Error('Network response was not ok');
    const glowStats: GlowStatsResponse = await response.json();

    return {
      price: glowStats.glowPrice,
      circulatingSupply: glowStats.circulatingSupply,
      totalSupply: glowStats.totalSupply,
      marketCap: glowStats.marketCap,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      price: 0,
      circulatingSupply: 0,
      totalSupply: 0,
      marketCap: 0,
    };
  }
}

export const getGlowTokenHolders = async () => {
  try {
    const query_result = await dune.getLatestResult({queryId: 4667126});
    return query_result.result.rows[0].latest_holder_count ?? 0;
  } catch (error) {
    console.error('Error fetching data:', error);
    return 0;
  }
}


export async function getGlowDailyPrice(): Promise<PriceData[]> {
  try {
    const response = await fetch(GLOW_PRICE_API);
    if (!response.ok) throw new Error('Network response was not ok');
    const glowDailyPrice: PriceData[] = await response.json();

    return glowDailyPrice;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}


export const getAllTokenData = async () => {
  const [
    glowStats, 
    glowTokenHolders, 
    glowPriceFromContract
  ] = await Promise.all([
    getGlowStats(),
    getGlowTokenHolders(),
    fetchGlowPriceFromContract()
    // getGlowDailyPrice()
  ]);

  return { 
    GlowMetrics: {...glowStats, holders: glowTokenHolders, glowPriceFromContract: glowPriceFromContract}, 
    // GlowDailyPrice: glowDailyPrice 
  };
}