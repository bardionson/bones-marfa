import sql from "@/app/api/utils/sql";

// GET /api/collectors/top - Get top collectors by minted count
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "7");

    const result = await sql`
      SELECT 
        ap.minted_by as wallet_address,
        up.name,
        COUNT(*) as minted_count,
        MIN(ap.minted_at) as first_mint_date,
        MAX(ap.minted_at) as last_mint_date
      FROM art_pieces ap
      LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
      WHERE ap.is_minted = true AND ap.minted_by IS NOT NULL
      GROUP BY ap.minted_by, up.name
      ORDER BY minted_count DESC, first_mint_date ASC
      LIMIT ${limit}
    `;

    const collectors = result.map((collector) => ({
      wallet_address: collector.wallet_address,
      name: collector.name,
      minted_count: parseInt(collector.minted_count),
      first_mint_date: collector.first_mint_date,
      last_mint_date: collector.last_mint_date,
    }));

    return Response.json({
      success: true,
      collectors,
    });
  } catch (error) {
    console.error("Error fetching top collectors:", error);
    return Response.json(
      {
        error: "Internal server error while fetching top collectors",
        code: "SERVER_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }
}