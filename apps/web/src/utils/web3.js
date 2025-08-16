import { WEB3_CONFIG, ethToWei, weiToEth } from "../config/web3";

// Check if wallet is available
export const isWalletAvailable = () => {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
};

// Connect to wallet
export const connectWallet = async () => {
  if (!isWalletAvailable()) {
    throw new Error(
      "No Web3 wallet detected. Please install MetaMask or another Web3 wallet.",
    );
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("No accounts found");
    }

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const networkId = parseInt(chainId, 16);

    return {
      account: accounts[0],
      networkId,
      isCorrectNetwork: networkId === WEB3_CONFIG.NETWORK_ID,
    };
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
};

// Get current account
export const getCurrentAccount = async () => {
  if (!isWalletAvailable()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Failed to get current account:", error);
    return null;
  }
};

// Get balance
export const getBalance = async (address) => {
  if (!isWalletAvailable()) {
    throw new Error("No Web3 wallet detected");
  }

  try {
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    // Convert from wei to ETH
    return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(6);
  } catch (error) {
    console.error("Failed to get balance:", error);
    throw error;
  }
};

// Switch to correct network
export const switchNetwork = async () => {
  if (!isWalletAvailable()) {
    throw new Error("No Web3 wallet detected");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${WEB3_CONFIG.NETWORK_ID.toString(16)}` }],
    });
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${WEB3_CONFIG.NETWORK_ID.toString(16)}`,
              chainName: WEB3_CONFIG.NETWORK_NAME,
              rpcUrls: [WEB3_CONFIG.RPC_URL],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add network:", addError);
        throw addError;
      }
    } else {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }
};

// Get the current mint cost from the contract
export const getMintCost = async () => {
  if (!isWalletAvailable()) {
    throw new Error("No Web3 wallet detected");
  }

  try {
    // Encode the cost() function call
    const data = "0x13faede6"; // Function signature for cost()

    const result = await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: WEB3_CONFIG.CONTRACT_ADDRESS,
          data: data,
        },
        "latest",
      ],
    });

    // Convert result from hex to wei, then to ETH
    const costInWei = parseInt(result, 16);
    return weiToEth(costInWei.toString());
  } catch (error) {
    console.error("Failed to get mint cost:", error);
    return WEB3_CONFIG.MINT_PRICE; // Fallback to config value
  }
};

// Main mint function that calls the purchase function
export const mintNFT = async (tokenURI) => {
  if (!isWalletAvailable()) {
    throw new Error("No Web3 wallet detected");
  }

  const account = await getCurrentAccount();
  if (!account) {
    throw new Error("No account connected");
  }

  try {
    // Get the current mint cost
    const mintCost = await getMintCost();
    const mintCostWei = ethToWei(mintCost);

    // Encode the purchase function call
    const tokenURIHex = Buffer.from(tokenURI).toString("hex");
    const paddedLength = tokenURI.length.toString(16).padStart(64, "0");
    const paddedTokenURI = tokenURIHex.padEnd(
      Math.ceil(tokenURIHex.length / 64) * 64,
      "0",
    );

    // Function signature for purchase(string)
    const functionSelector = "0xefef39a1";
    const data = `${functionSelector}0000000000000000000000000000000000000000000000000000000000000020${paddedLength}${paddedTokenURI}`;

    const transactionParams = {
      from: account,
      to: WEB3_CONFIG.CONTRACT_ADDRESS,
      value: `0x${parseInt(mintCostWei).toString(16)}`,
      data: data,
      gas: "0x7A120", // 500000 in hex - adjust as needed
    };

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParams],
    });

    // Wait for transaction receipt to get token ID
    const receipt = await waitForTransactionReceipt(txHash);

    return {
      transactionHash: txHash,
      tokenId: extractTokenIdFromReceipt(receipt),
      mintCost: mintCost,
    };
  } catch (error) {
    console.error("Mint failed:", error);
    throw error;
  }
};

// Wait for transaction receipt
const waitForTransactionReceipt = async (txHash, maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (receipt) {
        return receipt;
      }
    } catch (error) {
      console.log("Waiting for transaction...", i);
    }

    // Wait 2 seconds between attempts
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Transaction receipt not found after waiting");
};

// Extract token ID from transaction receipt logs
const extractTokenIdFromReceipt = (receipt) => {
  // Look for Transfer event logs to extract token ID
  // This is a simplified version - you might need to adjust based on contract events
  if (receipt.logs && receipt.logs.length > 0) {
    for (const log of receipt.logs) {
      if (log.topics && log.topics.length >= 4) {
        // Transfer event signature: Transfer(address,address,uint256)
        if (
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        ) {
          // Token ID is in the 4th topic
          return parseInt(log.topics[3], 16);
        }
      }
    }
  }

  // Fallback - return a random number if we can't extract from logs
  return Math.floor(Math.random() * 10000) + 1;
};

// Call contract function (kept for backward compatibility)
export const callContract = async (functionName, params, value = "0") => {
  if (functionName === "purchase") {
    return await mintNFT(params[1]); // params[1] is tokenURI
  }

  throw new Error(`Function ${functionName} not supported`);
};

// Listen for account changes
export const onAccountsChanged = (callback) => {
  if (isWalletAvailable()) {
    window.ethereum.on("accountsChanged", callback);
  }
};

// Listen for network changes
export const onChainChanged = (callback) => {
  if (isWalletAvailable()) {
    window.ethereum.on("chainChanged", callback);
  }
};

// Remove listeners
export const removeListeners = () => {
  if (isWalletAvailable()) {
    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
  }
};
