import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Zap, AlertCircle, CheckCircle2, Wallet } from 'lucide-react-native';
import { useWallet } from '../../../hooks/useWallet';
import { router, useLocalSearchParams } from 'expo-router';

// Simulated Web3 config for mobile
const WEB3_CONFIG = {
  MINT_PRICE: "0.01",
  NETWORK_NAME: "Ethereum",
};

export default function ArtPiecePage() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [mintError, setMintError] = useState(null);
  
  const { 
    account, 
    isConnected, 
    isCorrectNetwork,
    connect, 
    switchToCorrectNetwork,
    balance,
    formatAddress
  } = useWallet();

  // Fetch single art piece
  const { data: artData, isLoading, error } = useQuery({
    queryKey: ['artPiece', id],
    queryFn: async () => {
      const response = await fetch(`/api/art/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch art piece');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const artPiece = artData?.art_piece;

  // Mint mutation
  const mintMutation = useMutation({
    mutationFn: async ({ transactionHash, tokenId }) => {
      const response = await fetch(`/api/art/${id}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: account,
          token_id: tokenId,
          transaction_hash: transactionHash
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mint status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artPiece', id] });
      queryClient.invalidateQueries({ queryKey: ['artPieces'] });
    }
  });

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
      const mintPriceFloat = parseFloat(WEB3_CONFIG.MINT_PRICE);
      const balanceFloat = parseFloat(balance);
      
      if (balanceFloat < mintPriceFloat) {
        throw new Error(`Insufficient balance. Need ${WEB3_CONFIG.MINT_PRICE} ETH`);
      }

      // Simulate contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        transactionHash: `0x${Math.random().toString(16).substring(2)}`,
        tokenId: Math.floor(Math.random() * 10000) + 1
      };

      // Update database
      await mintMutation.mutateAsync({
        transactionHash: mockResult.transactionHash,
        tokenId: mockResult.tokenId
      });

      setMintSuccess(mockResult);

    } catch (error) {
      console.error('Minting failed:', error);
      setMintError(error.message);
    } finally {
      setIsMinting(false);
    }
  };

  const getMintButtonState = () => {
    if (!artPiece) return { disabled: true, text: 'Loading...' };
    if (artPiece.is_minted) return { disabled: true, text: 'Already Minted' };
    if (!isConnected) return { disabled: false, text: 'Connect Wallet to Mint' };
    if (!isCorrectNetwork) return { disabled: false, text: 'Switch Network' };
    if (isMinting) return { disabled: true, text: 'Minting...' };
    
    return { disabled: false, text: `Mint for ${WEB3_CONFIG.MINT_PRICE} ETH` };
  };

  const buttonState = getMintButtonState();

  const openLink = (url) => {
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Failed to open link')
    );
  };

  const goBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#0D0F11',
        paddingTop: insets.top,
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <StatusBar style="light" />
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
    );
  }

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
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          Art Piece Not Found
        </Text>
        <Text style={{ color: '#8C94A6', marginBottom: 24, textAlign: 'center' }}>
          The art piece you're looking for doesn't exist.
        </Text>
        <TouchableOpacity 
          onPress={goBack}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: '#0062FF',
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
            Back to Gallery
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0F11' }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View
        style={{
          backgroundColor: '#13171C',
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#1F252B',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
          <TouchableOpacity 
            onPress={goBack}
            style={{
              padding: 8,
              borderRadius: 8,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#8C94A6" />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              {artPiece?.title || 'Loading...'}
            </Text>
            <Text style={{ color: '#8C94A6', fontSize: 14 }}>
              ID: {artPiece?.identification_word || '...'}
            </Text>
          </View>
        </View>

        {isConnected && (
          <Text style={{ color: '#8C94A6', fontSize: 12 }}>
            {formatAddress(account)}
          </Text>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Art Display */}
        <View style={{ padding: 16 }}>
          <View style={{ 
            position: 'relative', 
            aspectRatio: 1, 
            backgroundColor: '#13161F', 
            borderRadius: 16, 
            overflow: 'hidden',
            marginBottom: 24 
          }}>
            <Image
              source={{ uri: artPiece?.ipfs_image_url }}
              style={{
                width: '100%',
                height: '100%',
              }}
              contentFit="cover"
              transition={200}
              placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iMjQiIGZpbGw9IiMzNzQxNEIiLz4KPC9zdmc+"
            />

            {/* Status Overlay */}
            {artPiece?.is_minted && (
              <View style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <View style={{
                  backgroundColor: '#00C853',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: '500' }}>Minted</Text>
                </View>
              </View>
            )}
          </View>

          {/* Art Information */}
          <View style={{ gap: 24 }}>
            <View>
              <Text
                style={{
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                {artPiece?.title}
              </Text>
              <Text
                style={{
                  color: '#2F80FF',
                  fontSize: 18,
                  fontWeight: '500',
                }}
              >
                ID: {artPiece?.identification_word}
              </Text>
            </View>

            {artPiece?.description && (
              <View>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                >
                  Description
                </Text>
                <Text
                  style={{
                    color: '#8C94A6',
                    fontSize: 16,
                    lineHeight: 24,
                  }}
                >
                  {artPiece.description}
                </Text>
              </View>
            )}

            {/* Status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: artPiece?.is_minted ? '#00C853' : '#FF9500',
              }} />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                {artPiece?.is_minted ? 'Minted' : 'Available for Minting'}
              </Text>
            </View>

            {/* Mint Information */}
            {artPiece?.is_minted && (
              <View style={{
                backgroundColor: '#13161F',
                borderRadius: 12,
                padding: 16,
                gap: 8
              }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
                  Mint Information
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8C94A6', fontSize: 14 }}>Minted By:</Text>
                  <Text style={{ color: '#60A5FA', fontSize: 14, fontFamily: 'monospace' }}>
                    {formatAddress(artPiece.minted_by)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8C94A6', fontSize: 14 }}>Token ID:</Text>
                  <Text style={{ color: 'white', fontSize: 14 }}>#{artPiece.token_id}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8C94A6', fontSize: 14 }}>Minted Date:</Text>
                  <Text style={{ color: 'white', fontSize: 14 }}>
                    {new Date(artPiece.minted_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            {/* IPFS Links */}
            <View style={{ gap: 12 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                IPFS Links
              </Text>
              
              <View style={{ gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => openLink(artPiece?.ipfs_metadata_url)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    backgroundColor: '#13161F',
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#8C94A6', fontSize: 14 }}>Metadata</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{
                        color: '#60A5FA',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        maxWidth: 150,
                      }}
                      numberOfLines={1}
                    >
                      {artPiece?.ipfs_metadata_url?.slice(0, 30)}...
                    </Text>
                    <ExternalLink size={16} color="#8C94A6" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => openLink(artPiece?.ipfs_image_url)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    backgroundColor: '#13161F',
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#8C94A6', fontSize: 14 }}>Image</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{
                        color: '#60A5FA',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        maxWidth: 150,
                      }}
                      numberOfLines={1}
                    >
                      {artPiece?.ipfs_image_url?.slice(0, 30)}...
                    </Text>
                    <ExternalLink size={16} color="#8C94A6" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Minting Section */}
            {!artPiece?.is_minted && (
              <View style={{ gap: 16 }}>
                <View style={{
                  backgroundColor: '#13161F',
                  borderRadius: 12,
                  padding: 16,
                  gap: 16
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 20,
                      fontWeight: '600'
                    }}>
                      Mint Price
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        color: '#2F80FF',
                        fontSize: 24,
                        fontWeight: 'bold'
                      }}>
                        {WEB3_CONFIG.MINT_PRICE} ETH
                      </Text>
                      {isConnected && balance && (
                        <Text style={{ color: '#8C94A6', fontSize: 12 }}>
                          Balance: {balance} ETH
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Network Warning */}
                  {isConnected && !isCorrectNetwork && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      backgroundColor: 'rgba(255, 149, 0, 0.1)',
                      borderWidth: 1,
                      borderColor: '#FF9500',
                      borderRadius: 8
                    }}>
                      <AlertCircle size={20} color="#FF9500" />
                      <Text style={{ color: '#FF9500', fontSize: 14, flex: 1 }}>
                        Please switch to {WEB3_CONFIG.NETWORK_NAME}
                      </Text>
                    </View>
                  )}

                  {/* Error Message */}
                  {mintError && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 1,
                      borderColor: '#EF4444',
                      borderRadius: 8
                    }}>
                      <AlertCircle size={20} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontSize: 14, flex: 1 }}>
                        {mintError}
                      </Text>
                    </View>
                  )}

                  {/* Success Message */}
                  {mintSuccess && (
                    <View style={{
                      padding: 16,
                      backgroundColor: 'rgba(0, 200, 83, 0.1)',
                      borderWidth: 1,
                      borderColor: '#00C853',
                      borderRadius: 8,
                      gap: 8
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={20} color="#00C853" />
                        <Text style={{ color: '#00C853', fontSize: 16, fontWeight: '500' }}>
                          Successfully Minted!
                        </Text>
                      </View>
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#8C94A6', fontSize: 14 }}>Token ID:</Text>
                          <Text style={{ color: 'white', fontSize: 14 }}>#{mintSuccess.tokenId}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => openLink(`https://etherscan.io/tx/${mintSuccess.transactionHash}`)}
                          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Text style={{ color: '#8C94A6', fontSize: 14 }}>Transaction:</Text>
                          <Text style={{ color: '#60A5FA', fontSize: 14, fontFamily: 'monospace' }}>
                            View on Etherscan
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Mint Button */}
                  <TouchableOpacity
                    onPress={handleMint}
                    disabled={buttonState.disabled}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      borderRadius: 12,
                      backgroundColor: buttonState.disabled
                        ? '#374151'
                        : '#0062FF',
                      opacity: buttonState.disabled ? 0.7 : 1,
                    }}
                    activeOpacity={buttonState.disabled ? 1 : 0.8}
                  >
                    {buttonState.disabled && !isConnected ? (
                      <Wallet size={20} color="white" />
                    ) : (
                      <Zap size={20} color="white" />
                    )}
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: '600',
                      }}
                    >
                      {buttonState.text}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}