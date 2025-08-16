import sql from '@/app/api/utils/sql';

// POST /api/seed - Add sample art pieces for demo
export async function POST(request) {
  try {
    // Sample IPFS URLs and metadata
    const sampleArtPieces = [
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata1',
        ipfs_image_url: 'https://images.pexels.com/photos/29506612/pexels-photo-29506612.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Digital Dreams #1',
        description: 'A vibrant exploration of digital landscapes and neon aesthetics. This piece represents the intersection of technology and artistic expression.',
        identification_word: 'NEON_PORTAL'
      },
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata2',
        ipfs_image_url: 'https://images.pexels.com/photos/29506609/pexels-photo-29506609.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Abstract Harmony #2',
        description: 'Flowing forms and electric colors merge to create a sense of movement and energy.',
        identification_word: 'ELECTRIC_FLOW'
      },
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata3',
        ipfs_image_url: 'https://images.pexels.com/photos/12961889/pexels-photo-12961889.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Gradient Genesis #3',
        description: 'Soft gradients and sculptural forms come together in this meditative digital artwork.',
        identification_word: 'PINK_GENESIS'
      },
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata4',
        ipfs_image_url: 'https://images.pexels.com/photos/29652327/pexels-photo-29652327.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Dark Matter #4',
        description: 'Exploring the mysteries of space and form through dark, sculptural compositions.',
        identification_word: 'DARK_SCULPT',
        is_minted: true,
        minted_at: new Date('2024-01-15'),
        minted_by: '0x742d35Cc6639C0532fEb42387b22e3f0a1dd9527',
        token_id: 1001
      },
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata5',
        ipfs_image_url: 'https://images.pexels.com/photos/33010867/pexels-photo-33010867.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Cyber Reflection #5',
        description: 'Reflecting on the future of human-digital interaction through bold visual metaphors.',
        identification_word: 'CYBER_MIRROR',
        is_minted: true,
        minted_at: new Date('2024-01-20'),
        minted_by: '0x8ba1f109551bD432803012645Hac136c4c0a5070',
        token_id: 1002
      },
      {
        ipfs_metadata_url: 'https://gateway.pinata.cloud/ipfs/QmSampleMetadata6',
        ipfs_image_url: 'https://images.pexels.com/photos/33012182/pexels-photo-33012182.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1024',
        title: 'Luminous Void #6',
        description: 'An exploration of light and darkness, presence and absence in digital space.',
        identification_word: 'LUMINOUS_VOID'
      }
    ];

    // Clear existing data
    await sql`DELETE FROM art_pieces`;

    // Insert sample data
    for (const piece of sampleArtPieces) {
      await sql`
        INSERT INTO art_pieces (
          ipfs_metadata_url, 
          ipfs_image_url, 
          title, 
          description, 
          identification_word,
          is_minted,
          minted_at,
          minted_by,
          token_id
        ) VALUES (
          ${piece.ipfs_metadata_url},
          ${piece.ipfs_image_url},
          ${piece.title},
          ${piece.description},
          ${piece.identification_word},
          ${piece.is_minted || false},
          ${piece.minted_at || null},
          ${piece.minted_by || null},
          ${piece.token_id || null}
        )
      `;
    }

    return Response.json({ 
      success: true, 
      message: `Successfully seeded ${sampleArtPieces.length} art pieces`,
      count: sampleArtPieces.length
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return Response.json({ 
      error: 'Failed to seed database' 
    }, { status: 500 });
  }
}