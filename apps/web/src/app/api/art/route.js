import sql from "@/app/api/utils/sql";
import { generateUniqueIds } from "@/utils/wordGenerator";
import {
  secureFetch,
  secureJsonResponse,
  sanitizeInput,
  isRateLimited,
} from "@/app/api/utils/security";

// POST /api/art - Submit new art piece via IPFS
export async function POST(request) {
  try {
    // Rate limiting - allow 10 requests per minute per IP
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(clientIP, 10, 60000)) {
      return secureJsonResponse(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { ipfs_metadata_url } = body;

    if (!ipfs_metadata_url) {
      return secureJsonResponse(
        {
          error: "IPFS metadata URL is required",
          code: "MISSING_IPFS_URL",
        },
        { status: 400 },
      );
    }

    // Sanitize and validate IPFS URL
    const sanitizedUrl = sanitizeInput(ipfs_metadata_url);
    if (!sanitizedUrl.startsWith("ipfs://") && !sanitizedUrl.includes("ipfs")) {
      return secureJsonResponse(
        {
          error:
            "Invalid IPFS URL format. Must start with ipfs:// or contain ipfs",
          code: "INVALID_IPFS_FORMAT",
        },
        { status: 400 },
      );
    }

    // Convert IPFS URL to HTTP gateway if needed
    let metadataUrl = sanitizedUrl;
    if (sanitizedUrl.startsWith("ipfs://")) {
      metadataUrl = sanitizedUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    // Fetch metadata from IPFS using secure fetch
    let metadata;
    try {
      console.log(`Fetching metadata from: ${metadataUrl}`);
      const metadataResponse = await secureFetch(metadataUrl, {
        headers: {
          Accept: "application/json",
        },
        // Use signal for timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!metadataResponse.ok) {
        return secureJsonResponse(
          {
            error: `Failed to fetch metadata from IPFS. Status: ${metadataResponse.status}`,
            code: "IPFS_FETCH_FAILED",
          },
          { status: 400 },
        );
      }

      metadata = await metadataResponse.json();
    } catch (error) {
      console.error("IPFS fetch error:", error);
      return secureJsonResponse(
        {
          error:
            "Invalid IPFS metadata URL or metadata format. Please check the URL is accessible.",
          code: "IPFS_FETCH_ERROR",
          details: error.message,
        },
        { status: 400 },
      );
    }

    // Sanitize metadata fields
    const { name, description, image, identification_word, attributes } =
      metadata;
    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = sanitizeInput(description || "");
    const sanitizedImage = sanitizeInput(image);
    const sanitizedIdentificationWord = sanitizeInput(
      identification_word || "",
    );

    if (!sanitizedName || !sanitizedImage) {
      return secureJsonResponse(
        {
          error: "Metadata must include required fields: name, image",
          code: "MISSING_REQUIRED_FIELDS",
          received_fields: Object.keys(metadata),
        },
        { status: 400 },
      );
    }

    // Convert image IPFS URL to HTTP if needed
    let imageUrl = sanitizedImage;
    if (sanitizedImage.startsWith("ipfs://")) {
      imageUrl = sanitizedImage.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    // Check if art piece already exists
    const existing = await sql`
      SELECT id, title FROM art_pieces WHERE ipfs_metadata_url = ${sanitizedUrl}
    `;

    if (existing.length > 0) {
      return secureJsonResponse(
        {
          error: "Art piece with this IPFS URL already exists",
          code: "DUPLICATE_ARTWORK",
          existing_id: existing[0].id,
          existing_title: existing[0].title,
        },
        { status: 409 },
      );
    }

    // Generate unique identification_word to prevent duplicates
    let identificationWord = sanitizedIdentificationWord;

    if (!identificationWord || identificationWord.trim() === "") {
      // Get existing identification words to avoid duplicates
      const existingIds = await sql`
        SELECT DISTINCT identification_word 
        FROM art_pieces 
        WHERE identification_word IS NOT NULL 
        AND identification_word != ''
      `;

      const existingSet = new Set(
        existingIds.map((row) => row.identification_word),
      );

      // Generate one unique ID
      const newIds = generateUniqueIds(1, existingSet);
      identificationWord = newIds[0];
    } else {
      // Check if the provided identification_word already exists
      const existingWithId = await sql`
        SELECT id FROM art_pieces WHERE identification_word = ${identificationWord}
      `;

      if (existingWithId.length > 0) {
        return secureJsonResponse(
          {
            error: "An art piece with this identification word already exists",
            code: "DUPLICATE_IDENTIFICATION_WORD",
            existing_id: existingWithId[0].id,
          },
          { status: 409 },
        );
      }
    }

    // Insert new art piece
    const result = await sql`
      INSERT INTO art_pieces (
        ipfs_metadata_url, 
        ipfs_image_url, 
        title, 
        description, 
        identification_word,
        metadata_json
      ) VALUES (
        ${sanitizedUrl},
        ${imageUrl},
        ${sanitizedName},
        ${sanitizedDescription},
        ${identificationWord},
        ${JSON.stringify(metadata)}
      )
      RETURNING *
    `;

    const artPiece = result[0];

    return secureJsonResponse(
      {
        success: true,
        message: "Art piece successfully created",
        art_piece: {
          id: artPiece.id,
          title: artPiece.title,
          description: artPiece.description,
          identification_word: artPiece.identification_word,
          ipfs_metadata_url: artPiece.ipfs_metadata_url,
          ipfs_image_url: artPiece.ipfs_image_url,
          is_minted: artPiece.is_minted,
          created_at: artPiece.created_at,
          metadata: metadata,
          traits: attributes || [],
          mint_url: `/art/${artPiece.id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating art piece:", error);
    return secureJsonResponse(
      {
        error: "Internal server error while creating art piece",
        code: "SERVER_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// GET /api/art - Get all art pieces for gallery
export async function GET(request) {
  try {
    // Rate limiting for GET requests too
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get_${clientIP}`, 60, 60000)) {
      return secureJsonResponse(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100,
    ); // Cap at 100
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0); // Ensure non-negative
    const minted_only = url.searchParams.get("minted_only") === "true";
    const search = sanitizeInput(url.searchParams.get("search") || "");
    const random = url.searchParams.get("random") === "true";

    // Build the query using function notation for dynamic ORDER BY
    let result = [];
    let countResult = [];

    try {
      if (minted_only && search) {
        // Both minted filter and search
        const searchPattern = `%${search}%`;
        if (random) {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE ap.is_minted = true
              AND (
                LOWER(ap.title) LIKE LOWER($1) OR 
                LOWER(ap.description) LIKE LOWER($2) OR 
                LOWER(ap.identification_word) LIKE LOWER($3)
              )
            ORDER BY RANDOM()
            LIMIT $4 OFFSET $5
          `,
            [searchPattern, searchPattern, searchPattern, limit, offset],
          );
        } else {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE ap.is_minted = true
              AND (
                LOWER(ap.title) LIKE LOWER($1) OR 
                LOWER(ap.description) LIKE LOWER($2) OR 
                LOWER(ap.identification_word) LIKE LOWER($3)
              )
            ORDER BY ap.created_at DESC
            LIMIT $4 OFFSET $5
          `,
            [searchPattern, searchPattern, searchPattern, limit, offset],
          );
        }

        countResult = await sql(
          `
          SELECT COUNT(*) FROM art_pieces ap
          WHERE ap.is_minted = true
            AND (
              LOWER(ap.title) LIKE LOWER($1) OR 
              LOWER(ap.description) LIKE LOWER($2) OR 
              LOWER(ap.identification_word) LIKE LOWER($3)
            )
        `,
          [searchPattern, searchPattern, searchPattern],
        );
      } else if (minted_only) {
        // Only minted filter
        if (random) {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE ap.is_minted = true
            ORDER BY RANDOM()
            LIMIT $1 OFFSET $2
          `,
            [limit, offset],
          );
        } else {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE ap.is_minted = true
            ORDER BY ap.created_at DESC
            LIMIT $1 OFFSET $2
          `,
            [limit, offset],
          );
        }

        countResult = await sql`
          SELECT COUNT(*) FROM art_pieces WHERE is_minted = true
        `;
      } else if (search) {
        // Only search
        const searchPattern = `%${search}%`;
        if (random) {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE (
              LOWER(ap.title) LIKE LOWER($1) OR 
              LOWER(ap.description) LIKE LOWER($2) OR 
              LOWER(ap.identification_word) LIKE LOWER($3)
            )
            ORDER BY RANDOM()
            LIMIT $4 OFFSET $5
          `,
            [searchPattern, searchPattern, searchPattern, limit, offset],
          );
        } else {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            WHERE (
              LOWER(ap.title) LIKE LOWER($1) OR 
              LOWER(ap.description) LIKE LOWER($2) OR 
              LOWER(ap.identification_word) LIKE LOWER($3)
            )
            ORDER BY ap.created_at DESC
            LIMIT $4 OFFSET $5
          `,
            [searchPattern, searchPattern, searchPattern, limit, offset],
          );
        }

        countResult = await sql(
          `
          SELECT COUNT(*) FROM art_pieces ap
          WHERE (
            LOWER(ap.title) LIKE LOWER($1) OR 
            LOWER(ap.description) LIKE LOWER($2) OR 
            LOWER(ap.identification_word) LIKE LOWER($3)
          )
        `,
          [searchPattern, searchPattern, searchPattern],
        );
      } else {
        // No filters
        if (random) {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            ORDER BY RANDOM()
            LIMIT $1 OFFSET $2
          `,
            [limit, offset],
          );
        } else {
          result = await sql(
            `
            SELECT 
              ap.id, ap.title, ap.description, ap.identification_word, 
              ap.ipfs_metadata_url, ap.ipfs_image_url, ap.is_minted, 
              ap.minted_at, ap.minted_by, ap.token_id, ap.created_at,
              ap.metadata_json, up.name as minter_name
            FROM art_pieces ap
            LEFT JOIN user_profiles up ON LOWER(ap.minted_by) = LOWER(up.wallet_address)
            ORDER BY ap.created_at DESC
            LIMIT $1 OFFSET $2
          `,
            [limit, offset],
          );
        }

        countResult = await sql`SELECT COUNT(*) FROM art_pieces`;
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return secureJsonResponse(
        {
          error: "Database error while fetching art pieces",
          code: "DATABASE_ERROR",
          details: dbError.message,
        },
        { status: 500 },
      );
    }

    const total =
      countResult.length > 0 ? parseInt(countResult[0].count || 0) : 0;

    // Parse metadata for each art piece
    const art_pieces = result.map((piece) => {
      try {
        const metadata = piece.metadata_json
          ? typeof piece.metadata_json === "string"
            ? JSON.parse(piece.metadata_json)
            : piece.metadata_json
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

    return secureJsonResponse({
      success: true,
      art_pieces,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
      filters: {
        minted_only,
        search,
        random,
      },
    });
  } catch (error) {
    console.error("Error fetching art pieces:", error);
    return secureJsonResponse(
      {
        error: "Internal server error while fetching art pieces",
        code: "SERVER_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
