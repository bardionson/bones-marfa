import sql from "@/app/api/utils/sql";

// Get all profiles or search by wallet
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (wallet) {
      // Get specific profile by wallet
      const profiles = await sql`
        SELECT id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
        FROM user_profiles
        WHERE LOWER(wallet_address) = LOWER(${wallet})
        LIMIT 1
      `;

      return Response.json({
        profile: profiles[0] || null,
      });
    }

    // Get all profiles
    const profiles = await sql`
      SELECT id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      FROM user_profiles
      ORDER BY created_at DESC
    `;

    return Response.json({
      profiles: profiles,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return Response.json(
      { error: "Failed to fetch profiles" },
      { status: 500 },
    );
  }
}

// Create or update profile
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      name,
      xHandle,
      farcasterHandle,
      instagramHandle,
      requestorWallet,
    } = body;

    if (!walletAddress || !name) {
      return Response.json(
        { error: "Wallet address and name are required" },
        { status: 400 },
      );
    }

    if (!requestorWallet) {
      return Response.json(
        { error: "Requestor wallet is required for authorization" },
        { status: 401 },
      );
    }

    // Check if requestor is trying to update their own profile
    const isOwnProfile =
      requestorWallet.toLowerCase() === walletAddress.toLowerCase();

    // If not updating own profile, check if requestor is an admin
    let isAdmin = false;
    if (!isOwnProfile) {
      const adminCheck = await sql`
        SELECT is_admin FROM user_profiles 
        WHERE LOWER(wallet_address) = LOWER(${requestorWallet})
        AND is_admin = true
        LIMIT 1
      `;
      isAdmin = adminCheck.length > 0;
    }

    // Authorization check
    if (!isOwnProfile && !isAdmin) {
      return Response.json(
        {
          error:
            "Unauthorized: You can only update your own profile or must be an admin to update others",
        },
        { status: 403 },
      );
    }

    // Check if profile exists
    const existingProfiles = await sql`
      SELECT id, is_admin FROM user_profiles 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      LIMIT 1
    `;

    let profile;
    if (existingProfiles.length > 0) {
      // Update existing profile
      const existingProfile = existingProfiles[0];
      const updatedProfiles = await sql`
        UPDATE user_profiles 
        SET 
          name = ${name},
          x_handle = ${xHandle || null},
          farcaster_handle = ${farcasterHandle || null},
          instagram_handle = ${instagramHandle || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingProfile.id}
        RETURNING id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      `;
      profile = updatedProfiles[0];
    } else {
      // Create new profile
      const newProfiles = await sql`
        INSERT INTO user_profiles (wallet_address, name, x_handle, farcaster_handle, instagram_handle)
        VALUES (${walletAddress}, ${name}, ${xHandle || null}, ${farcasterHandle || null}, ${instagramHandle || null})
        RETURNING id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      `;
      profile = newProfiles[0];
    }

    return Response.json({
      success: true,
      profile: profile,
    });
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    return Response.json(
      { error: "Failed to create/update profile" },
      { status: 500 },
    );
  }
}
