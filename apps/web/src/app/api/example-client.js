/**
 * Example Client Script for NFT Art API
 * 
 * This script demonstrates how to submit art to the NFT minting platform
 * from external applications (like code running on your laptop).
 * 
 * Usage:
 * 1. Replace the BASE_URL with your app's domain
 * 2. Replace the IPFS_METADATA_URL with your actual IPFS metadata URL
 * 3. Run this script from Node.js or any JavaScript environment
 */

// Configuration
const BASE_URL = 'https://your-app.com'; // Replace with your app's URL
const IPFS_METADATA_URL = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/metadata.json'; // Replace with your IPFS URL

/**
 * Submit a new art piece to the platform
 * @param {string} ipfsMetadataUrl - IPFS URL containing the metadata JSON
 * @returns {Promise<Object>} - API response
 */
async function submitArtPiece(ipfsMetadataUrl) {
  try {
    console.log('Submitting art piece...');
    console.log('IPFS Metadata URL:', ipfsMetadataUrl);
    
    const response = await fetch(`${BASE_URL}/api/art`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ipfs_metadata_url: ipfsMetadataUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${data.error || 'Unknown error'}`);
    }

    console.log('✅ Art piece submitted successfully!');
    console.log('Art Piece ID:', data.art_piece.id);
    console.log('Title:', data.art_piece.title);
    console.log('Mint URL:', `${BASE_URL}${data.art_piece.mint_url}`);
    
    return data;

  } catch (error) {
    console.error('❌ Error submitting art piece:', error.message);
    throw error;
  }
}

/**
 * Get all art pieces from the platform
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - API response
 */
async function getArtPieces(options = {}) {
  try {
    const params = new URLSearchParams();
    
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    if (options.minted_only) params.set('minted_only', options.minted_only);
    if (options.search) params.set('search', options.search);

    const url = `${BASE_URL}/api/art${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log('Fetching art pieces...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${data.error || 'Unknown error'}`);
    }

    console.log('✅ Art pieces fetched successfully!');
    console.log(`Found ${data.art_pieces.length} art pieces (${data.pagination.total} total)`);
    
    return data;

  } catch (error) {
    console.error('❌ Error fetching art pieces:', error.message);
    throw error;
  }
}

/**
 * Get a single art piece by ID
 * @param {number} id - Art piece ID
 * @returns {Promise<Object>} - API response
 */
async function getArtPiece(id) {
  try {
    console.log(`Fetching art piece ${id}...`);
    
    const response = await fetch(`${BASE_URL}/api/art/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${data.error || 'Unknown error'}`);
    }

    console.log('✅ Art piece fetched successfully!');
    console.log('Title:', data.art_piece.title);
    console.log('Minted:', data.art_piece.is_minted ? 'Yes' : 'No');
    
    return data;

  } catch (error) {
    console.error('❌ Error fetching art piece:', error.message);
    throw error;
  }
}

/**
 * Example metadata structure for IPFS
 */
const EXAMPLE_METADATA = {
  name: "Abstract Digital Art #001",
  description: "A unique piece of digital abstract art created with AI",
  image: "ipfs://QmNRyRpPkMr8FQX.../image.png",
  identification_word: "abstract_001",
  attributes: [
    {
      trait_type: "Style",
      value: "Abstract"
    },
    {
      trait_type: "Rarity",
      value: "Rare"
    },
    {
      trait_type: "Colors",
      value: 5
    },
    {
      trait_type: "AI Model",
      value: "DALL-E 3"
    }
  ]
};

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎨 NFT Art API Client Example');
    console.log('================================');
    
    // Example 1: Submit new art piece
    console.log('\n📤 Example 1: Submit New Art Piece');
    const submitResult = await submitArtPiece(IPFS_METADATA_URL);
    
    // Example 2: Get all art pieces
    console.log('\n📋 Example 2: Get All Art Pieces');
    const allArt = await getArtPieces({
      limit: 10,
      offset: 0
    });
    
    // Example 3: Get single art piece
    console.log('\n🖼️ Example 3: Get Single Art Piece');
    if (submitResult?.art_piece?.id) {
      await getArtPiece(submitResult.art_piece.id);
    }
    
    // Example 4: Search for minted pieces only
    console.log('\n🔍 Example 4: Search Minted Art Only');
    await getArtPieces({
      minted_only: true,
      limit: 5
    });
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Error handling for common issues
function validateIPFSUrl(url) {
  if (!url) {
    throw new Error('IPFS URL is required');
  }
  
  if (!url.startsWith('ipfs://') && !url.includes('ipfs')) {
    throw new Error('Invalid IPFS URL format. Must start with ipfs:// or contain ipfs');
  }
  
  return true;
}

// Utility: Create curl command for testing
function generateCurlCommand(ipfsUrl) {
  return `curl -X POST ${BASE_URL}/api/art \\
  -H "Content-Type: application/json" \\
  -d '{"ipfs_metadata_url": "${ipfsUrl}"}'`;
}

// Export functions if using as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    submitArtPiece,
    getArtPieces,
    getArtPiece,
    validateIPFSUrl,
    generateCurlCommand,
    EXAMPLE_METADATA
  };
}

// Run examples if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  // Validate before running
  try {
    validateIPFSUrl(IPFS_METADATA_URL);
    main();
  } catch (error) {
    console.error('❌ Configuration Error:', error.message);
    console.log('\n💡 Please update the IPFS_METADATA_URL at the top of this file');
    console.log('Example curl command:');
    console.log(generateCurlCommand('ipfs://YOUR_METADATA_HASH'));
  }
}