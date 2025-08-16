import sql from "@/app/api/utils/sql";
import { generateUniqueIds } from "@/utils/wordGenerator";

// POST /api/update-identifiers - Update art pieces without two-word identifiers
export async function POST(request) {
  try {
    // Get all art pieces that need two-word identifiers
    const artPiecesNeedingIds = await sql`
      SELECT id, identification_word 
      FROM art_pieces 
      WHERE identification_word IS NULL 
      OR identification_word = '' 
      OR identification_word !~ '^[a-z-]+\\-[a-z-]+$'
    `;

    if (artPiecesNeedingIds.length === 0) {
      return Response.json({
        success: true,
        message: "All art pieces already have valid two-word identifiers",
        updated: 0
      });
    }

    // Get existing two-word identifiers to avoid duplicates
    const existingIds = await sql`
      SELECT DISTINCT identification_word 
      FROM art_pieces 
      WHERE identification_word IS NOT NULL 
      AND identification_word != ''
      AND identification_word ~ '^[a-z-]+\\-[a-z-]+$'
    `;

    const existingSet = new Set(existingIds.map(row => row.identification_word));

    // Generate unique two-word identifiers for art pieces that need them
    const newIds = generateUniqueIds(artPiecesNeedingIds.length, existingSet);

    // Update each art piece with a new two-word identifier
    const updatePromises = artPiecesNeedingIds.map((piece, index) => {
      return sql`
        UPDATE art_pieces 
        SET identification_word = ${newIds[index]}
        WHERE id = ${piece.id}
      `;
    });

    await Promise.all(updatePromises);

    return Response.json({
      success: true,
      message: `Updated ${artPiecesNeedingIds.length} art pieces with two-word identifiers`,
      updated: artPiecesNeedingIds.length,
      newIdentifiers: newIds
    });

  } catch (error) {
    console.error("Error updating identifiers:", error);
    return Response.json(
      { error: "Failed to update identifiers" },
      { status: 500 }
    );
  }
}