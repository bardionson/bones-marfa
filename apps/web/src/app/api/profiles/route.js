import sql from "@/app/api/utils/sql";
import {
  secureJsonResponse,
  sanitizeInput,
  isValidWalletAddress,
  isRateLimited,
} from "@/app/api/utils/security";

// Get all profiles or search by wallet
export async function GET(request) {
  try {
    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`profiles_get_${clientIP}`, 30, 60000)) {
      return secureJsonResponse(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const wallet = sanitizeInput(searchParams.get("wallet") || "");

    if (wallet) {
      // Validate wallet address format
      if (!isValidWalletAddress(wallet)) {
        return secureJsonResponse(
          { error: "Invalid wallet address format" },
          { status: 400 },
        );
      }

      // Get specific profile by wallet
      const profiles = await sql`
        SELECT id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
        FROM user_profiles
        WHERE LOWER(wallet_address) = LOWER(${wallet})
        LIMIT 1
      `;

      return secureJsonResponse({
        profile: profiles[0] || null,
      });
    }

    // Get all profiles
    const profiles = await sql`
      SELECT id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      FROM user_profiles
      ORDER BY created_at DESC
    `;

    return secureJsonResponse({
      profiles: profiles,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return secureJsonResponse(
      { error: "Failed to fetch profiles" },
      { status: 500 },
    );
  }
}

// Create or update profile
export async function POST(request) {
  try {
    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`profiles_post_${clientIP}`, 5, 60000)) {
      return secureJsonResponse(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      walletAddress,
      name,
      xHandle,
      farcasterHandle,
      instagramHandle,
      requestorWallet,
    } = body;

    // Sanitize inputs
    const sanitizedWalletAddress = sanitizeInput(walletAddress || "");
    const sanitizedName = sanitizeInput(name || "");
    const sanitizedXHandle = sanitizeInput(xHandle || "");
    const sanitizedFarcasterHandle = sanitizeInput(farcasterHandle || "");
    const sanitizedInstagramHandle = sanitizeInput(instagramHandle || "");
    const sanitizedRequestorWallet = sanitizeInput(requestorWallet || "");

    if (!sanitizedWalletAddress || !sanitizedName) {
      return secureJsonResponse(
        { error: "Wallet address and name are required" },
        { status: 400 },
      );
    }

    // Validate wallet address formats
    if (!isValidWalletAddress(sanitizedWalletAddress)) {
      return secureJsonResponse(
        { error: "Invalid wallet address format" },
        { status: 400 },
      );
    }

    if (!sanitizedRequestorWallet) {
      return secureJsonResponse(
        { error: "Requestor wallet is required for authorization" },
        { status: 401 },
      );
    }

    if (!isValidWalletAddress(sanitizedRequestorWallet)) {
      return secureJsonResponse(
        { error: "Invalid requestor wallet address format" },
        { status: 400 },
      );
    }

    // Check if requestor is trying to update their own profile
    const isOwnProfile =
      sanitizedRequestorWallet.toLowerCase() ===
      sanitizedWalletAddress.toLowerCase();

    // If not updating own profile, check if requestor is an admin
    let isAdmin = false;
    if (!isOwnProfile) {
      const adminCheck = await sql`
        SELECT is_admin FROM user_profiles 
        WHERE LOWER(wallet_address) = LOWER(${sanitizedRequestorWallet})
        AND is_admin = true
        LIMIT 1
      `;
      isAdmin = adminCheck.length > 0;
    }

    // Authorization check
    if (!isOwnProfile && !isAdmin) {
      return secureJsonResponse(
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
      WHERE LOWER(wallet_address) = LOWER(${sanitizedWalletAddress})
      LIMIT 1
    `;

    let profile;
    if (existingProfiles.length > 0) {
      // Update existing profile
      const existingProfile = existingProfiles[0];
      const updatedProfiles = await sql`
        UPDATE user_profiles 
        SET 
          name = ${sanitizedName},
          x_handle = ${sanitizedXHandle || null},
          farcaster_handle = ${sanitizedFarcasterHandle || null},
          instagram_handle = ${sanitizedInstagramHandle || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingProfile.id}
        RETURNING id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      `;
      profile = updatedProfiles[0];
    } else {
      // Create new profile
      const newProfiles = await sql`
        INSERT INTO user_profiles (wallet_address, name, x_handle, farcaster_handle, instagram_handle)
        VALUES (${sanitizedWalletAddress}, ${sanitizedName}, ${sanitizedXHandle || null}, ${sanitizedFarcasterHandle || null}, ${sanitizedInstagramHandle || null})
        RETURNING id, wallet_address, name, x_handle, farcaster_handle, instagram_handle, is_admin, created_at, updated_at
      `;
      profile = newProfiles[0];
    }

    return secureJsonResponse({
      success: true,
      profile: profile,
    });
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    return secureJsonResponse(
      { error: "Failed to create/update profile" },
      { status: 500 },
    );
  }
}
