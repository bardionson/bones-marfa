import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useWallet } from "../../../hooks/useWallet";
import { WEB3_CONFIG } from "../../../config/web3";
import { mintNFT, getMintCost } from "../../../utils/web3";
import { isValidTwoWordId } from "../../../utils/wordGenerator";

export default function ArtPiecePage({ params }) {
  const { id: twoWordId } = params;
  const queryClient = useQueryClient();
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [mintError, setMintError] = useState(null);
  const [currentMintCost, setCurrentMintCost] = useState(
    WEB3_CONFIG.MINT_PRICE,
  );

  const {
    account,
    isConnected,
    isCorrectNetwork,
    connect,
    switchToCorrectNetwork,
    balance,
    formatAddress,
  } = useWallet();

  // Fetch current mint cost when wallet is connected
  useEffect(() => {
    const fetchMintCost = async () => {
      if (isConnected && isCorrectNetwork) {
        try {
          const cost = await getMintCost();
          setCurrentMintCost(cost);
        } catch (error) {
          console.error("Failed to get mint cost:", error);
        }
      }
    };

    fetchMintCost();
  }, [isConnected, isCorrectNetwork]);

  // Fetch single art piece
  const {
    data: artData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["artPiece", twoWordId],
    queryFn: async () => {
      const response = await fetch(`/api/art/${twoWordId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch art piece");
      }
      return response.json();
    },
    enabled: !!twoWordId && isValidTwoWordId(twoWordId),
  });

  const artPiece = artData?.art_piece;

  // Mint mutation
  const mintMutation = useMutation({
    mutationFn: async ({ transactionHash, tokenId, mintCost }) => {
      const response = await fetch(`/api/art/${twoWordId}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account,
          transactionHash,
          tokenId,
          mintCost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update mint status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artPiece", twoWordId] });
      queryClient.invalidateQueries({ queryKey: ["artPieces"] });
    },
  });

  // Early return for invalid ID format
  if (!isValidTwoWordId(twoWordId)) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">Invalid Art Piece ID</h2>
        <p className="text-[#8C94A6] mb-6">
          The art piece identifier format is invalid.
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg transition-colors duration-200"
        >
          Back to Gallery
        </a>
      </div>
    );
  }

  const handleMint = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!isCorrectNetwork) {
      await switchToCorrectNetwork();
      return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintSuccess(null);

    try {
      // Check if user has enough balance
      const mintPriceFloat = parseFloat(currentMintCost);
      const balanceFloat = parseFloat(balance);

      if (balanceFloat < mintPriceFloat) {
        throw new Error(`Insufficient balance. Need ${currentMintCost} ETH`);
      }

      // Call smart contract mint function
      const result = await mintNFT(artPiece.ipfs_metadata_url);

      // Update database with mint results
      const dbResult = await mintMutation.mutateAsync({
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        mintCost: result.mintCost,
      });

      setMintSuccess({
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        explorerUrl: dbResult.data.explorerUrl,
      });
    } catch (error) {
      console.error("Minting failed:", error);

      // Handle specific error messages
      if (error.message.includes("user rejected")) {
        setMintError("Transaction was cancelled");
      } else if (error.message.includes("insufficient funds")) {
        setMintError("Insufficient funds for transaction");
      } else {
        setMintError(error.message);
      }
    } finally {
      setIsMinting(false);
    }
  };

  const getMintButtonState = () => {
    if (!artPiece) return { disabled: true, text: "Loading..." };
    if (artPiece.is_minted) return { disabled: true, text: "Already Minted" };
    if (!isConnected)
      return { disabled: false, text: "Connect Wallet to Mint" };
    if (!isCorrectNetwork) return { disabled: false, text: "Switch Network" };
    if (isMinting) return { disabled: true, text: "Minting..." };

    return { disabled: false, text: `Mint for ${currentMintCost} ETH` };
  };

  const buttonState = getMintButtonState();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">Art Piece Not Found</h2>
        <p className="text-[#8C94A6] mb-6">
          The art piece you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg transition-colors duration-200"
        >
          Back to Gallery
        </a>
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
                {artPiece?.title || "Loading..."}
              </h1>
              <p className="text-[#8C94A6] text-sm">
                ID: {artPiece?.identification_word || "..."}
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="text-sm text-[#8C94A6]">
              Connected: {formatAddress(account)}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Art Display */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-[#13161F] rounded-2xl overflow-hidden">
              <img
                src={artPiece?.ipfs_image_url}
                alt={artPiece?.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iMjQiIGZpbGw9IiMzNzQxNEIiLz4KPHRleHQgeD0iMjU2IiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFydCBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==";
                }}
              />
            </div>

            {/* IPFS Links */}
            <div className="space-y-3">
              <h3 className="text-white font-poppins font-medium text-lg">
                IPFS Links
              </h3>

              <div className="space-y-2">
                <a
                  href={artPiece?.ipfs_metadata_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-[#13161F] rounded-lg hover:bg-[#171B26] transition-colors duration-200"
                >
                  <span className="text-[#8C94A6] text-sm">Metadata</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#60A5FA] text-sm font-mono truncate max-w-[200px]">
                      {artPiece?.ipfs_metadata_url?.slice(0, 30)}...
                    </span>
                    <ExternalLink className="w-4 h-4 text-[#8C94A6]" />
                  </div>
                </a>

                <a
                  href={artPiece?.ipfs_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-[#13161F] rounded-lg hover:bg-[#171B26] transition-colors duration-200"
                >
                  <span className="text-[#8C94A6] text-sm">Image</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#60A5FA] text-sm font-mono truncate max-w-[200px]">
                      {artPiece?.ipfs_image_url?.slice(0, 30)}...
                    </span>
                    <ExternalLink className="w-4 h-4 text-[#8C94A6]" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Art Details & Minting */}
          <div className="space-y-8">
            {/* Art Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-white font-poppins font-bold text-3xl mb-2">
                  {artPiece?.title}
                </h2>
                <p className="text-[#2F80FF] font-poppins font-medium text-lg">
                  ID: {artPiece?.identification_word}
                </p>
              </div>

              {artPiece?.description && (
                <div>
                  <h3 className="text-white font-poppins font-semibold text-lg mb-3">
                    Description
                  </h3>
                  <p className="text-[#8C94A6] font-poppins leading-relaxed">
                    {artPiece.description}
                  </p>
                </div>
              )}

              {/* Traits/Attributes */}
              {artPiece?.metadata?.attributes &&
                artPiece.metadata.attributes.length > 0 && (
                  <div>
                    <h3 className="text-white font-poppins font-semibold text-lg mb-3">
                      Traits
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {artPiece.metadata.attributes.map((trait, index) => (
                        <div
                          key={index}
                          className="bg-[#13161F] rounded-lg p-3 text-center"
                        >
                          <div className="text-[#8C94A6] text-sm font-medium uppercase tracking-wide">
                            {trait.trait_type}
                          </div>
                          <div className="text-white font-poppins font-semibold mt-1">
                            {trait.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Status */}
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    artPiece?.is_minted ? "bg-[#00C853]" : "bg-[#FF9500]"
                  }`}
                />
                <span className="text-white font-medium">
                  {artPiece?.is_minted ? "Minted" : "Available for Minting"}
                </span>
              </div>

              {artPiece?.is_minted && (
                <div className="bg-[#13161F] rounded-lg p-4 space-y-2">
                  <h4 className="text-white font-medium">Mint Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8C94A6]">Minted By:</span>
                      <span className="text-[#60A5FA] font-mono">
                        {artPiece.minter_name ||
                          formatAddress(artPiece.minted_by)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C94A6]">Token ID:</span>
                      <span className="text-white">#{artPiece.token_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C94A6]">Minted Date:</span>
                      <span className="text-white">
                        {new Date(artPiece.minted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Minting Section */}
            {!artPiece?.is_minted && (
              <div className="space-y-6">
                <div className="bg-[#13161F] rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-poppins font-semibold text-xl">
                      Mint Price
                    </h3>
                    <div className="text-right">
                      <div className="text-[#2F80FF] font-poppins font-bold text-2xl">
                        {currentMintCost} ETH
                      </div>
                      {isConnected && balance && (
                        <div className="text-[#8C94A6] text-sm">
                          Balance: {balance} ETH
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Network Info */}
                  <div className="text-sm text-[#8C94A6]">
                    Network: {WEB3_CONFIG.NETWORK_NAME}
                  </div>

                  {/* Network Warning */}
                  {isConnected && !isCorrectNetwork && (
                    <div className="flex items-center space-x-2 p-3 bg-[#FF9500] bg-opacity-10 border border-[#FF9500] rounded-lg">
                      <AlertCircle className="w-5 h-5 text-[#FF9500]" />
                      <span className="text-[#FF9500] text-sm">
                        Please switch to {WEB3_CONFIG.NETWORK_NAME}
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {mintError && (
                    <div className="flex items-center space-x-2 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 text-sm">{mintError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {mintSuccess && (
                    <div className="p-4 bg-[#00C853] bg-opacity-10 border border-[#00C853] rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-[#00C853]" />
                        <span className="text-[#00C853] font-medium">
                          Successfully Minted!
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#8C94A6]">Token ID:</span>
                          <span className="text-white">
                            #{mintSuccess.tokenId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8C94A6]">Transaction:</span>
                          <a
                            href={mintSuccess.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#60A5FA] hover:underline font-mono"
                          >
                            View on Explorer
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mint Button */}
                  <button
                    onClick={handleMint}
                    disabled={buttonState.disabled}
                    className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-poppins font-semibold text-lg transition-all duration-200 ${
                      buttonState.disabled
                        ? "bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                        : "bg-gradient-to-r from-[#0062FF] to-[#4287FF] hover:from-[#1a72ff] hover:to-[#5ba3ff] text-white active:scale-95"
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span>{buttonState.text}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Font Styles */}
      <style jsx global>{`
        .font-poppins {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
