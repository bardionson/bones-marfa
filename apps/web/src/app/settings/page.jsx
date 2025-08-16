"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  TestTube,
  Globe,
  CheckCircle2,
  Shield,
  User,
  AlertCircle,
} from "lucide-react";
import { WEB3_CONFIG } from "../../config/web3";
import { useWallet } from "../../hooks/useWallet";

const ADMIN_WALLET = "0x01cB023186CAB05220554EE75b4D69921DD051f1";

export default function SettingsPage() {
  const { account, isConnected, connect, formatAddress } = useWallet();
  const [currentEnvironment, setCurrentEnvironment] = useState(
    WEB3_CONFIG.ENVIRONMENT,
  );
  const [saved, setSaved] = useState(false);

  // Check if current user is admin
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminProfile", account],
    queryFn: async () => {
      const response = await fetch(`/api/profiles?wallet=${account}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!account && isConnected,
  });

  const profile = profileData?.profile;
  const isAdmin =
    profile?.is_admin ||
    (account && account.toLowerCase() === ADMIN_WALLET.toLowerCase());

  const handleEnvironmentChange = (env) => {
    setCurrentEnvironment(env);

    // Update the config (this would need to be persisted in a real app)
    WEB3_CONFIG.ENVIRONMENT = env;

    // Show saved confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Trigger page reload to refresh contract address
    setTimeout(() => window.location.reload(), 1000);
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#6B7683] mx-auto mb-4" />
          <h2 className="text-white font-semibold text-2xl mb-2">
            Admin Access Required
          </h2>
          <p className="text-[#8C94A6] mb-6">
            Connect your wallet to access settings
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg transition-colors duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-2xl mb-2">
            Access Denied
          </h2>
          <p className="text-[#8C94A6] mb-2">
            Only administrators can access settings
          </p>
          <p className="text-[#6B7683] text-sm mb-6">
            Connected: {formatAddress(account)}
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg transition-colors duration-200"
          >
            Back to Gallery
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F11] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#13171C] bg-opacity-90 backdrop-blur-sm border-b border-[#1F252B] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="p-2 hover:bg-[#1A1F25] rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-[#8C94A6]" />
            </a>
            <div>
              <h1 className="text-white font-poppins font-semibold text-lg">
                Contract Settings
              </h1>
              <p className="text-[#8C94A6] text-sm">
                Configure your smart contract environment
              </p>
            </div>
          </div>
          <Settings className="w-6 h-6 text-[#8C94A6]" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-8">
          {/* Environment Selection */}
          <div className="bg-[#13161F] rounded-lg p-6">
            <h2 className="text-white font-poppins font-semibold text-xl mb-4">
              Contract Environment
            </h2>
            <p className="text-[#8C94A6] text-sm mb-6">
              Switch between test and production contracts. Make sure you're on
              the correct network when minting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Test Environment */}
              <div
                onClick={() => handleEnvironmentChange("TEST")}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  currentEnvironment === "TEST"
                    ? "border-[#FF9500] bg-[#FF9500] bg-opacity-10"
                    : "border-[#1F252B] hover:border-[#374151] bg-[#0F1419]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TestTube className="w-6 h-6 text-[#FF9500]" />
                    <h3 className="text-white font-poppins font-semibold">
                      Test Network
                    </h3>
                  </div>
                  {currentEnvironment === "TEST" && (
                    <CheckCircle2 className="w-5 h-5 text-[#00C853]" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Network:</span>
                    <span className="text-white">
                      {WEB3_CONFIG.NETWORK_NAME}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Contract:</span>
                    <span className="text-[#60A5FA] font-mono text-xs">
                      {WEB3_CONFIG.TEST_CONTRACT_ADDRESS.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Status:</span>
                    <span className="text-[#FF9500]">Testing</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#FF9500] bg-opacity-5 rounded border border-[#FF9500] border-opacity-20">
                  <p className="text-[#FF9500] text-xs">
                    Use this for testing and development. NFTs minted here are
                    for testing purposes only.
                  </p>
                </div>
              </div>

              {/* Production Environment */}
              <div
                onClick={() => handleEnvironmentChange("PRODUCTION")}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  currentEnvironment === "PRODUCTION"
                    ? "border-[#00C853] bg-[#00C853] bg-opacity-10"
                    : "border-[#1F252B] hover:border-[#374151] bg-[#0F1419]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-[#00C853]" />
                    <h3 className="text-white font-poppins font-semibold">
                      Production Network
                    </h3>
                  </div>
                  {currentEnvironment === "PRODUCTION" && (
                    <CheckCircle2 className="w-5 h-5 text-[#00C853]" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Network:</span>
                    <span className="text-white">
                      {WEB3_CONFIG.NETWORK_NAME}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Contract:</span>
                    <span className="text-[#60A5FA] font-mono text-xs">
                      {WEB3_CONFIG.PRODUCTION_CONTRACT_ADDRESS.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Status:</span>
                    <span className="text-[#00C853]">Live</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#00C853] bg-opacity-5 rounded border border-[#00C853] border-opacity-20">
                  <p className="text-[#00C853] text-xs">
                    Use this for live minting. Real ETH will be required for
                    transactions.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {saved && (
              <div className="mt-4 p-3 bg-[#00C853] bg-opacity-10 border border-[#00C853] rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                  <span className="text-[#00C853] text-sm">
                    Settings saved! Refreshing page...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Current Configuration */}
          <div className="bg-[#13161F] rounded-lg p-6">
            <h2 className="text-white font-poppins font-semibold text-xl mb-4">
              Current Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-[#8C94A6] font-medium">
                  Environment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Current Mode:</span>
                    <span
                      className={`font-medium ${
                        WEB3_CONFIG.ENVIRONMENT === "TEST"
                          ? "text-[#FF9500]"
                          : "text-[#00C853]"
                      }`}
                    >
                      {WEB3_CONFIG.ENVIRONMENT}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Active Contract:</span>
                    <span className="text-[#60A5FA] font-mono text-xs">
                      {WEB3_CONFIG.CONTRACT_ADDRESS}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Network ID:</span>
                    <span className="text-white">{WEB3_CONFIG.NETWORK_ID}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[#8C94A6] font-medium">
                  Contract Functions
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Mint Function:</span>
                    <span className="text-white font-mono">
                      purchase(string)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Cost Function:</span>
                    <span className="text-white font-mono">cost()</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C94A6]">Token URI:</span>
                    <span className="text-white font-mono">
                      tokenURI(uint256)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#13161F] rounded-lg p-6">
            <h2 className="text-white font-poppins font-semibold text-xl mb-4">
              How to Switch to Production
            </h2>

            <div className="space-y-4 text-sm text-[#8C94A6]">
              <div className="space-y-2">
                <h3 className="text-white font-medium">
                  Before switching to production:
                </h3>
                <ul className="space-y-1 pl-4">
                  <li>• Deploy your contract to the production network</li>
                  <li>
                    • Add the production contract address to your environment
                    variables
                  </li>
                  <li>• Test all functions thoroughly on the test network</li>
                  <li>• Verify your contract on the blockchain explorer</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium">
                  Environment Variables:
                </h3>
                <div className="bg-[#0F1419] rounded p-3 font-mono text-xs">
                  <div>NEXT_PUBLIC_PRODUCTION_CONTRACT_ADDRESS=0x...</div>
                  <div>NEXT_PUBLIC_RPC_URL=https://...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
    </div>
  );
}
