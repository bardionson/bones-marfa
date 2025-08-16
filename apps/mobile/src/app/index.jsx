import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, Wallet } from 'lucide-react-native';
import { useWallet } from '../hooks/useWallet';
import { router } from 'expo-router';

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
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

  const filterTabs = ['All', 'Available', 'Minted'];

  // Fetch art pieces
  const { data: artData, isLoading, error, refetch } = useQuery({
    queryKey: ['artPieces', filter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filter === 'Minted') {
        queryParams.append('minted_only', 'true');
      }
      
      const response = await fetch(`/api/art?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch art pieces');
      }
      return response.json();
    },
  });

  const artPieces = artData?.art_pieces || [];
  
  // Filter by search term
  const filteredArtPieces = artPieces.filter(piece => {
    const matchesSearch = !searchTerm || 
      piece.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.identification_word.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'Available') {
      return matchesSearch && !piece.is_minted;
    } else if (filter === 'Minted') {
      return matchesSearch && piece.is_minted;
    }
    
    return matchesSearch;
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
    await refetch();
    setRefreshing(false);
  };

  const navigateToArt = (artId) => {
    router.push(`/art/${artId}`);
  };

  const renderArtPiece = ({ item, index }) => (
    <TouchableOpacity 
      onPress={() => navigateToArt(item.id)}
      style={{
        backgroundColor: '#13161F',
        borderRadius: 16,
        marginHorizontal: index % 2 === 0 ? 0 : 8,
        marginBottom: 16,
        overflow: 'hidden'
      }}
      activeOpacity={0.8}
    >
      {/* Art Image */}
      <View style={{ position: 'relative', aspectRatio: 1 }}>
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
        
        {/* Status Badge */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: item.is_minted ? '#00C853' : '#FF9500',
            }}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '500',
            }}
          >
            {item.is_minted ? 'Minted' : 'Available'}
          </Text>
        </View>
      </View>

      {/* Art Info */}
      <View style={{ padding: 16, gap: 12 }}>
        <Text
          style={{
            color: '#2F80FF',
            fontSize: 16,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        
        <View style={{ gap: 4 }}>
          <Text style={{ color: '#8C94A6', fontSize: 12 }}>
            ID Word
          </Text>
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            {item.identification_word}
          </Text>
        </View>

        {item.description && (
          <Text
            style={{
              color: '#8C94A6',
              fontSize: 14,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                fontSize: 20,
                fontWeight: '600',
              }}
            >
              NFT Gallery
            </Text>
          </View>

          {/* Wallet Button */}
          <TouchableOpacity
            onPress={handleWalletAction}
            disabled={isConnecting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: isConnected ? '#00C853' : '#0062FF',
              borderRadius: 8,
              opacity: isConnecting ? 0.5 : 1,
            }}
          >
            <Wallet size={16} color="white" />
            <Text
              style={{
                color: 'white',
                fontSize: 14,
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
            placeholder="Search by title or ID word..."
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

      {/* Section Header & Filters */}
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            NFT Collection
          </Text>
          <Text style={{ color: '#8C94A6', fontSize: 14 }}>
            Discover and mint unique digital art pieces
          </Text>
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 20,
                backgroundColor: filter === tab 
                  ? '#2941FF' 
                  : 'transparent',
                borderWidth: filter === tab ? 0 : 1,
                borderColor: '#374151',
              }}
            >
              <Text
                style={{
                  color: filter === tab ? 'white' : '#8C94A6',
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <View
        style={{
          width: 64,
          height: 64,
          backgroundColor: '#13161F',
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Search size={32} color="#6B7683" />
      </View>
      <Text
        style={{
          color: 'white',
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        No art pieces found
      </Text>
      <Text
        style={{
          color: '#8C94A6',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        {searchTerm 
          ? 'Try adjusting your search terms'
          : 'No art pieces have been submitted yet'
        }
      </Text>
    </View>
  );

  if (error) {
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
          Failed to load art pieces
        </Text>
        <TouchableOpacity 
          onPress={() => refetch()}
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
      
      <FlatList
        data={filteredArtPieces}
        renderItem={renderArtPiece}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0062FF"
            colors={['#0062FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {isLoading && (
        <View 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -16,
            marginTop: -16
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderWidth: 2,
              borderColor: '#0062FF',
              borderTopColor: 'transparent',
              borderRadius: 16,
            }}
          />
        </View>
      )}
    </View>
  );
}