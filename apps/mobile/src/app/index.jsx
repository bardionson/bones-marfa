import { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, Wallet, Settings, User, Crown, TrendingUp } from 'lucide-react-native';
import { useWallet } from '../hooks/useWallet';
import { router } from 'expo-router';

const ADMIN_WALLET = "0x01cB023186CAB05220554EE75b4D69921DD051f1";

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect,
    formatAddress,
    error: walletError 
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

  // Fetch recent unminted art pieces
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
    refetch: refetchMinted,
  } = useInfiniteQuery({
    queryKey: ["mintedGallery", searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = new URLSearchParams();
      queryParams.append("minted_only", "true");
      queryParams.append("random", "true");
      queryParams.append("limit", "8"); // Smaller limit for mobile
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

  const handleWalletAction = async () => {
    try {
      if (isConnected) {
        disconnect();
      } else {
        await connect();
      }
    } catch (err) {
      Alert.alert('Wallet Error', err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      recentUnmintedData && refetchMinted(),
    ]);
    setRefreshing(false);
  };

  const navigateToArt = (artId) => {
    router.push(`/art/${artId}`);
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const recentUnmintedPieces = recentUnmintedData?.art_pieces || [];
  const featuredPiece = recentUnmintedPieces[0];
  const recentSmallPieces = recentUnmintedPieces.slice(1, 4); // Show fewer on mobile
  const collectors = collectorsData?.collectors || [];
  const allMintedPieces = mintedData?.pages?.flatMap((page) => page.art_pieces) || [];

  const filteredMintedPieces = allMintedPieces.filter(piece => {
    return !searchTerm || 
      piece.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.identification_word.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderMintedArtPiece = ({ item, index }) => (
    <TouchableOpacity 
      onPress={() => navigateToArt(item.identification_word)}
      style={{
        backgroundColor: '#13161F',
        borderRadius: 16,
        marginHorizontal: index % 2 === 0 ? 0 : 4,
        marginBottom: 8,
        overflow: 'hidden',
        flex: 1,
      }}
      activeOpacity={0.8}
    >
      {/* Art Image */}
      <View style={{ aspectRatio: 1 }}>
        <Image
          source={{ uri: item.ipfs_image_url }}
          style={{
            width: '100%',
            height: '100%',
          }}
          contentFit="cover"
          transition={200}
          placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiByeD0iMTYiIGZpbGw9IiMzNzQxNEIiLz4KPC9zdmc+"
        />
      </View>

      {/* Art Info */}
      <View style={{ padding: 12, gap: 8 }}>
        <Text
          style={{
            color: '#2F80FF',
            fontSize: 14,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        
        <View style={{ gap: 2 }}>
          <Text style={{ color: '#8C94A6', fontSize: 10 }}>
            ID
          </Text>
          <Text
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {item.identification_word}
          </Text>
        </View>

        {item.token_id && (
          <View style={{ gap: 2 }}>
            <Text style={{ color: '#8C94A6', fontSize: 10 }}>
              Token ID
            </Text>
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '500',
              }}
            >
              #{item.token_id}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (recentError) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#0D0F11',
        paddingTop: insets.top,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16
      }}>
        <StatusBar style="light" />
        <Text style={{ color: '#EF4444', fontSize: 16, marginBottom: 16 }}>
          Failed to load content
        </Text>
        <TouchableOpacity 
          onPress={onRefresh}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: '#0062FF',
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0F11' }}>
      <StatusBar style="light" />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0062FF"
            colors={['#0062FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: '#13171C',
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1F252B',
          }}
        >
          {/* Top Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            {/* Logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#0062FF',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                  N
                </Text>
              </View>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  flexShrink: 1,
                }}
                numberOfLines={2}
              >
                Bones In The Simulatation (Marfa)
              </Text>
            </View>

            {/* Navigation & Wallet */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Profile Link - shows for all connected users */}
              {isConnected && (
                <TouchableOpacity
                  onPress={navigateToProfile}
                  style={{
                    padding: 8,
                    backgroundColor: '#1A1F25',
                    borderRadius: 8,
                  }}
                >
                  <User size={16} color="#8C94A6" />
                </TouchableOpacity>
              )}

              {/* Settings Link - admin only */}
              {isAdmin && (
                <TouchableOpacity
                  onPress={navigateToSettings}
                  style={{
                    padding: 8,
                    backgroundColor: '#1A1F25',
                    borderRadius: 8,
                  }}
                >
                  <Settings size={16} color="#8C94A6" />
                </TouchableOpacity>
              )}

              {/* Wallet Button */}
              <TouchableOpacity
                onPress={handleWalletAction}
                disabled={isConnecting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isConnected ? '#00C853' : '#0062FF',
                  borderRadius: 8,
                  opacity: isConnecting ? 0.5 : 1,
                }}
              >
                <Wallet size={14} color="white" />
                <Text
                  style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: '500',
                  }}
                >
                  {isConnecting 
                    ? 'Connecting...' 
                    : isConnected 
                    ? formatAddress(account)
                    : 'Connect'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View
            style={{
              position: 'relative',
              backgroundColor: '#1A1F25',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#1F252B',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 12,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Search size={16} color="#6B7683" />
            </View>
            <TextInput
              placeholder="Search minted pieces..."
              placeholderTextColor="#6B7683"
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{
                paddingLeft: 40,
                paddingRight: 16,
                paddingVertical: 12,
                color: 'white',
                fontSize: 14,
              }}
            />
          </View>

          {/* Error Message */}
          {walletError && (
            <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 8 }}>
              {walletError}
            </Text>
          )}
        </View>

        {/* Hero Section */}
        <View style={{ padding: 16, paddingTop: 24, paddingBottom: 32 }}>
          <Text
            style={{
              color: 'white',
              fontSize: 28,
              fontWeight: 'bold',
              marginBottom: 12,
              lineHeight: 34,
            }}
          >
            Bones In The Simulatation (Marfa)
          </Text>
          <Text 
            style={{ 
              color: '#8C94A6', 
              fontSize: 16, 
              lineHeight: 22,
            }}
          >
            A unique collection of digital art pieces capturing moments frozen in time. Each piece tells a story, waiting for the right collector to bring it to life on the blockchain.
          </Text>
        </View>

        {/* Section 1: Recent Unminted Art */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={20} color="#0062FF" />
              <Text
                style={{
                  color: 'white',
                  fontSize: 20,
                  fontWeight: '600',
                }}
              >
                Latest Shot
              </Text>
            </View>
            <Text style={{ color: '#8C94A6', fontSize: 12 }}>
              The decisive moment awaiting the decisive mint
            </Text>
          </View>

          {recentLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderWidth: 2,
                  borderColor: '#0062FF',
                  borderTopColor: 'transparent',
                  borderRadius: 12,
                }}
              />
            </View>
          ) : recentUnmintedPieces.length > 0 ? (
            <View style={{ gap: 16 }}>
              {/* Featured Large Image */}
              {featuredPiece && (
                <TouchableOpacity
                  onPress={() => navigateToArt(featuredPiece.identification_word)}
                  activeOpacity={0.9}
                >
                  <View style={{ backgroundColor: '#13161F', borderRadius: 16, overflow: 'hidden' }}>
                    <View style={{ aspectRatio: 1 }}>
                      <Image
                        source={{ uri: featuredPiece.ipfs_image_url }}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        contentFit="cover"
                        transition={200}
                      />
                    </View>
                    <View style={{ padding: 16, gap: 12 }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 20,
                          fontWeight: 'bold',
                        }}
                      >
                        {featuredPiece.title}
                      </Text>
                      {featuredPiece.description && (
                        <Text
                          style={{
                            color: '#E5E7EB',
                            fontSize: 14,
                            lineHeight: 20,
                          }}
                          numberOfLines={3}
                        >
                          {featuredPiece.description}
                        </Text>
                      )}
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          backgroundColor: '#0062FF',
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                          View Details
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Row of Recent Small Images */}
              {recentSmallPieces.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                  style={{ flexGrow: 0 }}
                >
                  {recentSmallPieces.map((piece) => (
                    <TouchableOpacity
                      key={piece.id}
                      onPress={() => navigateToArt(piece.identification_word)}
                      style={{
                        width: 120,
                        backgroundColor: '#13161F',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ aspectRatio: 1 }}>
                        <Image
                          source={{ uri: piece.ipfs_image_url }}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                      <View style={{ padding: 8, gap: 4 }}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 12,
                            fontWeight: '500',
                          }}
                          numberOfLines={1}
                        >
                          {piece.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: '#8C94A6', fontSize: 14 }}>
                No recent art pieces available
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: Top Collectors */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Crown size={18} color="#FFD700" />
              <Text
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                Top Collectors
              </Text>
            </View>
          </View>

          {collectorsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: '#0062FF',
                  borderTopColor: 'transparent',
                  borderRadius: 10,
                }}
              />
            </View>
          ) : collectorsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#EF4444', fontSize: 12 }}>
                Failed to load collectors
              </Text>
            </View>
          ) : collectors.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              style={{ flexGrow: 0 }}
            >
              {collectors.map((collector, index) => (
                <View
                  key={collector.wallet_address}
                  style={{
                    backgroundColor: '#13161F',
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 140,
                    borderWidth: 1,
                    borderColor: '#1F252B',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 
                          index === 0 ? '#FFD700' :
                          index === 1 ? '#C0C0C0' :
                          index === 2 ? '#CD7F32' : '#2F80FF',
                      }}
                    >
                      <Text
                        style={{
                          color: index < 3 ? 'black' : 'white',
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 12,
                          fontWeight: '500',
                        }}
                        numberOfLines={1}
                      >
                        {collector.name || formatAddress(collector.wallet_address)}
                      </Text>
                      <Text style={{ color: '#6B7683', fontSize: 10 }}>
                        {collector.minted_count} minted
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#8C94A6', fontSize: 12 }}>
                No collectors yet
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Minted Gallery */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              Minted Collection
            </Text>
            <Text style={{ color: '#8C94A6', fontSize: 12, marginTop: 2 }}>
              Browse all minted pieces in random order
            </Text>
          </View>

          {/* Loading State */}
          {mintedLoading && filteredMintedPieces.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderWidth: 2,
                  borderColor: '#0062FF',
                  borderTopColor: 'transparent',
                  borderRadius: 12,
                }}
              />
            </View>
          )}

          {/* Error State */}
          {mintedError && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: '#EF4444', fontSize: 14, marginBottom: 16 }}>
                Failed to load minted pieces
              </Text>
            </View>
          )}

          {/* Minted Art Grid */}
          {!mintedLoading && !mintedError && (
            <>
              <FlatList
                data={filteredMintedPieces}
                renderItem={renderMintedArtPiece}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                numColumns={2}
                columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                scrollEnabled={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
              />

              {/* Load More Button */}
              {hasNextPage && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={isFetchingNextPage}
                  style={{
                    marginTop: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: isFetchingNextPage ? '#374151' : '#0062FF',
                    borderRadius: 8,
                    alignSelf: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Empty State */}
              {filteredMintedPieces.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#13161F',
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Search size={24} color="#6B7683" />
                  </View>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}
                  >
                    No minted art pieces found
                  </Text>
                  <Text
                    style={{
                      color: '#8C94A6',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'No art pieces have been minted yet'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}