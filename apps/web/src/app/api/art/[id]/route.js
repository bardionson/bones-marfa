import sql from "@/app/api/utils/sql";
import { isValidTwoWordId } from "@/utils/wordGenerator";

// GET /api/art/[id] - Get single art piece by two-word ID
export async function GET(request, { params }) {
  try {
    const { id: twoWordId } = params;

    // Validate the two-word ID format
    if (!isValidTwoWordId(twoWordId)) {
      return Response.json(
        { error: "Invalid art piece identifier format" },
        { status: 400 },
      );
    }

    const result = await sql`
      SELECT 
        ap.*,
        up.name as minter_name
      FROM art_pieces ap
      LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
      WHERE ap.identification_word = ${twoWordId}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Art piece not found" }, { status: 404 });
    }

    return Response.json({ art_piece: result[0] });
  } catch (error) {
    console.error("Error fetching art piece:", error);
    return Response.json(
      {
        error: "Failed to fetch art piece",
      },
      { status: 500 },
    );
  }
}
