import sql from "@/app/api/utils/sql";
import { isValidTwoWordId } from "@/utils/wordGenerator";

// POST /api/art/[id]/mint - Mark art piece as minted
export async function POST(request, { params }) {
  try {
    const { id: twoWordId } = params;
    const body = await request.json();
    const { walletAddress, transactionHash, tokenId, mintCost } = body;

    // Validate the two-word ID format
    if (!isValidTwoWordId(twoWordId)) {
      return Response.json(
        { error: "Invalid art piece identifier format" },
        { status: 400 },
      );
    }

    if (!walletAddress || !transactionHash) {
      return Response.json(
        {
          error: "Wallet address and transaction hash are required",
        },
        { status: 400 },
      );
    }

    // Check if art piece exists and is not already minted
    const existing = await sql`
      SELECT * FROM art_pieces WHERE identification_word = ${twoWordId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: "Art piece not found" }, { status: 404 });
    }

    if (existing[0].is_minted) {
      return Response.json(
        { error: "Art piece is already minted" },
        { status: 409 },
      );
    }

    // Update art piece as minted
    const result = await sql`
      UPDATE art_pieces 
      SET 
        is_minted = true,
        minted_at = CURRENT_TIMESTAMP,
        minted_by = ${walletAddress},
        token_id = ${tokenId || null}
      WHERE identification_word = ${twoWordId}
      RETURNING *
    `;

    return Response.json({
      success: true,
      message: "NFT minted successfully!",
      data: {
        artPiece: result[0],
        transactionHash,
        tokenId,
        mintCost,
        explorerUrl: `https://shapescan.xyz/tx/${transactionHash}`,
      },
    });
  } catch (error) {
    console.error("Error minting art piece:", error);
    return Response.json(
      {
        error: "Failed to mint art piece",
      },
      { status: 500 },
    );
  }
}
