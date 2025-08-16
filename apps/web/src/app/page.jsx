"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Wallet,
  Settings,
  User,
  Crown,
  TrendingUp,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";

const ADMIN_WALLET = "0x01cB023186CAB05220554EE75b4D69921DD051f1";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const observerRef = useRef(null);
  const lastElementRef = useRef(null);

  const {
    account,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    formatAddress,
    error: walletError,
  } = useWallet();

  // Fetch user profile to check admin status
  const { data: profileData } = useQuery({
    queryKey: ["userProfile", account],
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

  // Fetch recent unminted art pieces (auto-refresh every 30 seconds)
  const {
    data: recentUnmintedData,
    isLoading: recentLoading,
    error: recentError,
  } = useQuery({
    queryKey: ["recentUnminted"],
    queryFn: async () => {
      const response = await fetch("/api/art/recent-unminted?limit=6");
      if (!response.ok) {
        throw new Error("Failed to fetch recent unminted art");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch top collectors
  const {
    data: collectorsData,
    isLoading: collectorsLoading,
    error: collectorsError,
  } = useQuery({
    queryKey: ["topCollectors"],
    queryFn: async () => {
      const response = await fetch("/api/collectors/top?limit=7");
      if (!response.ok) {
        throw new Error("Failed to fetch top collectors");
      }
      return response.json();
    },
  });

  // Infinite scroll for minted gallery with random sorting
  const {
    data: mintedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: mintedLoading,
    error: mintedError,
  } = useInfiniteQuery({
    queryKey: ["mintedGallery", searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = new URLSearchParams();
      queryParams.append("minted_only", "true");
      queryParams.append("random", "true");
      queryParams.append("limit", "12");
      queryParams.append("offset", pageParam.toString());
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const response = await fetch(`/api/art?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch minted art pieces");
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_more
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined;
    },
    initialPageParam: 0,
  });

  // Infinite scroll intersection observer
  useEffect(() => {
    const element = lastElementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const recentUnmintedPieces = recentUnmintedData?.art_pieces || [];
  const featuredPiece = recentUnmintedPieces[0];
  const recentSmallPieces = recentUnmintedPieces.slice(1, 6);
  const collectors = collectorsData?.collectors || [];
  const allMintedPieces =
    mintedData?.pages?.flatMap((page) => page.art_pieces) || [];

  return (
    <div className="min-h-screen bg-[#0D0F11] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#13171C] bg-opacity-90 backdrop-blur-sm border-b border-[#1F252B] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0062FF] to-[#4287FF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-white font-semibold text-xl">
              Bones In The Simulatation (Marfa)
            </h1>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#6B7683]" />
              </div>
              <input
                type="text"
                placeholder="Search minted pieces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1F25] border border-[#1F252B] rounded-full text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent hover:border-[#374151] transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Navigation & Wallet */}
          <div className="flex items-center space-x-3">
            {walletError && (
              <div className="text-red-400 text-sm">{walletError}</div>
            )}

            {/* Profile Link - shows for all connected users */}
            {isConnected && (
              <a
                href="/profile"
                className="flex items-center space-x-2 px-3 py-2 bg-[#1A1F25] hover:bg-[#2A2F35] text-[#8C94A6] hover:text-white rounded-lg transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">
                  {profile?.name || "Profile"}
                </span>
              </a>
            )}

            {/* Settings Link - admin only */}
            {isAdmin && (
              <a
                href="/settings"
                className="flex items-center space-x-2 px-3 py-2 bg-[#1A1F25] hover:bg-[#2A2F35] text-[#8C94A6] hover:text-white rounded-lg transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Settings</span>
              </a>
            )}

            <button
              onClick={handleWalletAction}
              disabled={isConnecting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isConnected
                  ? "bg-[#00C853] hover:bg-[#00A846] text-white"
                  : "bg-[#0062FF] hover:bg-[#1a72ff] text-white"
              } ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Wallet size={16} />
              <span>
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                    ? formatAddress(account)
                    : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#6B7683]" />
            </div>
            <input
              type="text"
              placeholder="Search minted pieces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-[#1A1F25] border border-[#1F252B] rounded-full text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-12">
        {/* Hero Section */}
        <section className="py-8 md:py-12">
          <h1 className="text-white font-bold text-4xl md:text-6xl tracking-tight mb-4">
            Bones In The Simulatation (Marfa)
          </h1>
          <p className="text-[#8C94A6] text-lg md:text-xl max-w-3xl leading-relaxed">
            A unique collection of digital art pieces capturing moments frozen
            in time. Each piece tells a story, waiting for the right collector
            to bring it to life on the blockchain.
          </p>
        </section>

        {/* Section 1: Recent Unminted Art */}
        <section>
          <div className="mb-6">
            <h2 className="text-white font-semibold text-2xl md:text-3xl tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-[#0062FF]" />
              <span>Latest Shot</span>
            </h2>
            <p className="text-[#8C94A6] text-sm mt-1">
              The decisive moment awaiting the decisive mint
            </p>
          </div>

          {recentLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentError ? (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">
                Failed to load recent art pieces
              </p>
            </div>
          ) : recentUnmintedPieces.length > 0 ? (
            <div className="space-y-6">
              {/* Featured Large Image - Side by side layout */}
              {featuredPiece && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Image */}
                  <div className="group">
                    <div className="aspect-square bg-[#13161F] rounded-2xl overflow-hidden">
                      <img
                        src={featuredPiece.ipfs_image_url}
                        alt={featuredPiece.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDgwMCA4MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiByeD0iMjQiIGZpbGw9IiMzNzQxNEIiLz4KPHRleHQgeD0iNDAwIiB5PSI0MjAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFydCBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==";
                        }}
                      />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div>
                      <h3 className="text-white font-bold text-2xl md:text-4xl mb-3">
                        {featuredPiece.title}
                      </h3>
                    </div>

                    {featuredPiece.description && (
                      <p className="text-[#E5E7EB] text-base leading-relaxed">
                        {featuredPiece.description}
                      </p>
                    )}

                    <div className="pt-4">
                      <a
                        href={`/art/${featuredPiece.identification_word}`}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <span>View Details</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Row of 5 Recent Small Images */}
              {recentSmallPieces.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {recentSmallPieces.map((piece) => (
                    <div key={piece.id} className="group">
                      <div className="aspect-square bg-[#13161F] rounded-xl overflow-hidden">
                        <img
                          src={piece.ipfs_image_url}
                          alt={piece.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiByeD0iMTYiIGZpbGw9IiMzNzQxNEIiLz4KPHRleHQgeD0iMTYwIiB5PSIxNzAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFydCBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==";
                          }}
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-white font-medium text-sm truncate">
                          {piece.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-[#8C94A6]">No recent art pieces available</p>
            </div>
          )}
        </section>

        {/* Section 2: Top Collectors */}
        <section>
          <div className="mb-6">
            <h2 className="text-white font-semibold text-xl md:text-2xl tracking-tight flex items-center space-x-2">
              <Crown className="w-5 h-5 text-[#FFD700]" />
              <span>Top Collectors</span>
            </h2>
          </div>

          {collectorsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : collectorsError ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">Failed to load collectors</p>
            </div>
          ) : collectors.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div
                className="flex space-x-4 pb-2"
                style={{ minWidth: "fit-content" }}
              >
                {collectors.map((collector, index) => (
                  <div
                    key={collector.wallet_address}
                    className="flex-shrink-0 bg-[#13161F] rounded-lg p-4 min-w-[200px] border border-[#1F252B] hover:border-[#374151] transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-[#FFD700] text-black"
                            : index === 1
                              ? "bg-[#C0C0C0] text-black"
                              : index === 2
                                ? "bg-[#CD7F32] text-black"
                                : "bg-[#2F80FF] text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {collector.name ||
                            formatAddress(collector.wallet_address)}
                        </p>
                        <p className="text-[#6B7683] text-xs">
                          {collector.minted_count} minted
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#8C94A6] text-sm">No collectors yet</p>
            </div>
          )}
        </section>

        {/* Section 3: Minted Gallery with Infinite Scroll */}
        <section>
          <div className="mb-6">
            <h2 className="text-white font-semibold text-xl md:text-2xl tracking-tight">
              Minted Collection
            </h2>
            <p className="text-[#8C94A6] text-sm mt-1">
              Browse all minted pieces in random order
            </p>
          </div>

          {/* Loading State */}
          {mintedLoading && allMintedPieces.length === 0 && (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error State */}
          {mintedError && (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">Failed to load minted pieces</p>
            </div>
          )}

          {/* Minted Art Grid */}
          {!mintedLoading && !mintedError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allMintedPieces.map((artPiece, index) => (
                <a
                  key={`${artPiece.id}-${index}`}
                  href={`/art/${artPiece.identification_word}`}
                  className="group block"
                  ref={
                    index === allMintedPieces.length - 1 ? lastElementRef : null
                  }
                >
                  <div className="bg-[#13161F] rounded-2xl overflow-hidden hover:bg-[#171B26] active:bg-[#1A1F25] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                    {/* Art Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={artPiece.ipfs_image_url}
                        alt={artPiece.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiByeD0iMTYiIGZpbGw9IiMzNzQxNEIiLz4KPHRleHQgeD0iMTYwIiB5PSIxNzAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFydCBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==";
                        }}
                      />
                    </div>

                    {/* Art Info */}
                    <div className="p-4 space-y-3">
                      <h3 className="text-[#2F80FF] font-semibold text-base group-hover:text-[#5BA3FF] transition-colors duration-200 truncate">
                        {artPiece.title}
                      </h3>

                      <div className="space-y-1">
                        <p className="text-[#8C94A6] text-xs">ID</p>
                        <p className="text-white font-medium text-sm">
                          {artPiece.identification_word}
                        </p>
                      </div>

                      {artPiece.token_id && (
                        <div className="space-y-1">
                          <p className="text-[#8C94A6] text-xs">Token ID</p>
                          <p className="text-white font-medium text-sm">
                            #{artPiece.token_id}
                          </p>
                        </div>
                      )}

                      {artPiece.description && (
                        <p className="text-[#8C94A6] text-sm line-clamp-2">
                          {artPiece.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Loading More */}
          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Empty State */}
          {!mintedLoading && !mintedError && allMintedPieces.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#13161F] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#6B7683]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                No minted art pieces found
              </h3>
              <p className="text-[#8C94A6] text-sm">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No art pieces have been minted yet"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Font Styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
}
