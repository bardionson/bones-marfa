import sql from "@/app/api/utils/sql";

// GET /api/art/recent-unminted - Get recent unminted art pieces
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "6");

    const result = await sql`
      SELECT 
        id, title, description, identification_word, 
        ipfs_metadata_url, ipfs_image_url, is_minted, 
        created_at, metadata_json
      FROM art_pieces 
      WHERE is_minted = false
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;

    // Parse metadata for each art piece
    const art_pieces = result.map((piece) => {
      try {
        const metadata = piece.metadata_json
          ? JSON.parse(piece.metadata_json)
          : null;
        return {
          ...piece,
          metadata,
          traits: metadata?.attributes || [],
        };
      } catch (parseError) {
        console.error(
          "Error parsing metadata for piece:",
          piece.id,
          parseError,
        );
        return {
          ...piece,
          metadata: null,
          traits: [],
        };
      }
    });

    return Response.json({
      success: true,
      art_pieces,
    });
  } catch (error) {
    console.error("Error fetching recent unminted art pieces:", error);
    return Response.json(
      {
        error: "Internal server error while fetching recent unminted art pieces",
        code: "SERVER_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }
}