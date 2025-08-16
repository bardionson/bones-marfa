// Web3 Configuration for NFT Minting
export const WEB3_CONFIG = {
  // Environment - change this for production
  ENVIRONMENT: "TEST", // "TEST" or "PRODUCTION"

  // Contract addresses
  TEST_CONTRACT_ADDRESS: "0x1A822EF7e9Cb1D7867CB4C52ef174ACEb053E8ce",
  PRODUCTION_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_PRODUCTION_CONTRACT_ADDRESS ||
    "0x1234567890123456789012345678901234567890",

  // Get current contract address based on environment
  get CONTRACT_ADDRESS() {
    return this.ENVIRONMENT === "TEST"
      ? this.TEST_CONTRACT_ADDRESS
      : this.PRODUCTION_CONTRACT_ADDRESS;
  },

  // Minting price in ETH (will be fetched from contract settings)
  MINT_PRICE: "0.01", // Default fallback - actual price from contract

  // Network configuration (Shape Network based on the explorer)
  NETWORK_ID: 360, // Shape Network
  NETWORK_NAME: "Shape Network",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.shape.network",

  // Supported wallets
  SUPPORTED_WALLETS: [
    "MetaMask",
    "WalletConnect",
    "Coinbase Wallet",
    "Trust Wallet",
    "Ledger",
    "Trezor",
  ],

  // Contract ABI with the purchase function
  CONTRACT_ABI: [
    {
      inputs: [{ internalType: "string", name: "tokenURI", type: "string" }],
      name: "purchase",
      outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "cost",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      name: "tokenURI",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
  ],
};

// Convert ETH to Wei (for contract calls)
export const ethToWei = (eth) => {
  return (parseFloat(eth) * Math.pow(10, 18)).toString();
};

// Convert Wei to ETH (for display)
export const weiToEth = (wei) => {
  return (parseInt(wei) / Math.pow(10, 18)).toString();
};
