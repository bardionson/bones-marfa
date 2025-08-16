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

    // Safe parse for metadata that may be stored as JSON, text, or malformed legacy values
    const safeParseMetadata = (value) => {
      if (!value) return null;
      if (typeof value === "object") return value; // already parsed JSON
      if (typeof value === "string") {
        const str = value.trim();
        const tryParse = (s) => {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        };
        // Only attempt JSON.parse if it looks like JSON (avoids "[object Object]")
        if (str.startsWith("{") || str.startsWith("[")) {
          const first = tryParse(str);
          // Handle double-encoded JSON strings
          if (typeof first === "string") {
            const second = tryParse(first);
            return second ?? null;
          }
          return first;
        }
        return null;
      }
      return null;
    };

    // Parse metadata for each art piece safely
    const art_pieces = result.map((piece) => {
      const metadata = safeParseMetadata(piece.metadata_json);
      return {
        ...piece,
        metadata,
        traits: Array.isArray(metadata?.attributes) ? metadata.attributes : [],
      };
    });

    return Response.json({
      success: true,
      art_pieces,
    });
  } catch (error) {
    console.error("Error fetching recent unminted art pieces:", error);
    return Response.json(
      {
        error:
          "Internal server error while fetching recent unminted art pieces",
        code: "SERVER_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
