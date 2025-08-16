import { useState, useEffect, useCallback } from 'react';
import { 
  connectWallet, 
  getCurrentAccount, 
  getBalance,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
  isWalletAvailable,
  switchNetwork
} from '../utils/web3';
import { WEB3_CONFIG } from '../config/web3';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is available
  const walletAvailable = isWalletAvailable();

  // Connect wallet function
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectWallet();
      setAccount(result.account);
      setNetworkId(result.networkId);
      setIsCorrectNetwork(result.isCorrectNetwork);
      
      // Get balance
      if (result.account) {
        const userBalance = await getBalance(result.account);
        setBalance(userBalance);
      }
    } catch (err) {
      setError(err.message);
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet function
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setNetworkId(null);
    setIsCorrectNetwork(false);
    setError(null);
  }, []);

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await switchNetwork();
      setIsCorrectNetwork(true);
      setError(null);
    } catch (err) {
      setError(`Failed to switch network: ${err.message}`);
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async () => {
    if (account) {
      try {
        const userBalance = await getBalance(account);
        setBalance(userBalance);
      } catch (err) {
        console.error('Failed to update balance:', err);
      }
    }
  }, [account]);

  // Initialize wallet connection on mount
  useEffect(() => {
    const initWallet = async () => {
      if (!walletAvailable) return;

      try {
        const currentAccount = await getCurrentAccount();
        if (currentAccount) {
          setAccount(currentAccount);
          
          // Get network info
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const currentNetworkId = parseInt(chainId, 16);
          setNetworkId(currentNetworkId);
          setIsCorrectNetwork(currentNetworkId === WEB3_CONFIG.NETWORK_ID);
          
          // Get balance
          const userBalance = await getBalance(currentAccount);
          setBalance(userBalance);
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
      }
    };

    initWallet();
  }, [walletAvailable]);

  // Set up event listeners
  useEffect(() => {
    if (!walletAvailable) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        getBalance(accounts[0]).then(setBalance).catch(console.error);
      }
    };

    const handleChainChanged = (chainId) => {
      const newNetworkId = parseInt(chainId, 16);
      setNetworkId(newNetworkId);
      setIsCorrectNetwork(newNetworkId === WEB3_CONFIG.NETWORK_ID);
      
      // Refresh balance when network changes
      if (account) {
        updateBalance();
      }
    };

    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    return () => {
      removeListeners();
    };
  }, [walletAvailable, account, disconnect, updateBalance]);

  // Format address for display
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    // State
    account,
    balance,
    networkId,
    isCorrectNetwork,
    isConnecting,
    error,
    walletAvailable,
    isConnected: !!account,

    // Actions  
    connect,
    disconnect,
    switchToCorrectNetwork,
    updateBalance,
    
    // Helpers
    formatAddress
  };
};