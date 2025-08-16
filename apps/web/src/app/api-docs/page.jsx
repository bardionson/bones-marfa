"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Code,
  Database,
  Zap,
  ArrowLeft,
} from "lucide-react";

export default function APIDocumentationPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  const copyToClipboard = (text, endpoint) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-app.com";

  const endpoints = [
    {
      method: "POST",
      path: "/api/art",
      title: "Submit New Art Piece",
      description:
        "Submit a new art piece via IPFS metadata URL. The API will fetch the metadata and store the art piece.",
      requestBody: {
        ipfs_metadata_url:
          "string (required) - IPFS URL containing the metadata JSON",
      },
      responses: {
        201: "Art piece successfully created",
        400: "Invalid request or IPFS URL",
        409: "Art piece already exists",
        500: "Server error",
      },
      example: {
        request: {
          ipfs_metadata_url:
            "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/metadata.json",
        },
        response: {
          success: true,
          message: "Art piece successfully created",
          art_piece: {
            id: 1,
            title: "Abstract Digital Art #001",
            description: "A unique piece of digital abstract art",
            identification_word: "abstract_001",
            ipfs_metadata_url:
              "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/metadata.json",
            ipfs_image_url: "https://ipfs.io/ipfs/QmNRyRpPkMr8FQX...",
            is_minted: false,
            created_at: "2024-01-15T10:30:00Z",
            metadata: {
              name: "Abstract Digital Art #001",
              description: "A unique piece of digital abstract art",
              image: "ipfs://QmNRyRpPkMr8FQX...",
              attributes: [
                { trait_type: "Style", value: "Abstract" },
                { trait_type: "Rarity", value: "Rare" },
              ],
            },
            traits: [
              { trait_type: "Style", value: "Abstract" },
              { trait_type: "Rarity", value: "Rare" },
            ],
            mint_url: "/art/1",
          },
        },
      },
    },
    {
      method: "GET",
      path: "/api/art",
      title: "Get Art Gallery",
      description:
        "Retrieve all art pieces with pagination and filtering options.",
      queryParams: {
        limit: "number (default: 50) - Number of items per page",
        offset: "number (default: 0) - Number of items to skip",
        minted_only: "boolean (default: false) - Show only minted pieces",
        search: "string - Search by title, description, or identification word",
      },
      responses: {
        200: "Successfully retrieved art pieces",
        500: "Server error",
      },
      example: {
        request: "?limit=10&offset=0&minted_only=false&search=abstract",
        response: {
          success: true,
          art_pieces: [
            {
              id: 1,
              title: "Abstract Digital Art #001",
              description: "A unique piece of digital abstract art",
              identification_word: "abstract_001",
              ipfs_metadata_url:
                "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/metadata.json",
              ipfs_image_url: "https://ipfs.io/ipfs/QmNRyRpPkMr8FQX...",
              is_minted: false,
              minted_at: null,
              minted_by: null,
              token_id: null,
              created_at: "2024-01-15T10:30:00Z",
              traits: [{ trait_type: "Style", value: "Abstract" }],
            },
          ],
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            has_more: false,
          },
          filters: {
            minted_only: false,
            search: "abstract",
          },
        },
      },
    },
    {
      method: "GET",
      path: "/api/art/{id}",
      title: "Get Single Art Piece",
      description: "Retrieve a specific art piece by its ID.",
      pathParams: {
        id: "number (required) - Art piece ID",
      },
      responses: {
        200: "Successfully retrieved art piece",
        404: "Art piece not found",
        500: "Server error",
      },
      example: {
        request: "/api/art/1",
        response: {
          success: true,
          art_piece: {
            id: 1,
            title: "Abstract Digital Art #001",
            description: "A unique piece of digital abstract art",
            identification_word: "abstract_001",
            ipfs_metadata_url:
              "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/metadata.json",
            ipfs_image_url: "https://ipfs.io/ipfs/QmNRyRpPkMr8FQX...",
            is_minted: false,
            created_at: "2024-01-15T10:30:00Z",
            traits: [{ trait_type: "Style", value: "Abstract" }],
          },
        },
      },
    },
    {
      method: "POST",
      path: "/api/art/{id}/mint",
      title: "Update Mint Status",
      description:
        "Update the mint status after successful blockchain transaction.",
      pathParams: {
        id: "number (required) - Art piece ID",
      },
      requestBody: {
        walletAddress: "string (required) - Wallet address that minted the NFT",
        transactionHash: "string (required) - Blockchain transaction hash",
        tokenId: "number (required) - NFT token ID from contract",
        mintCost: "string (required) - Cost of minting in ETH",
      },
      responses: {
        200: "Mint status successfully updated",
        400: "Invalid request",
        404: "Art piece not found",
        500: "Server error",
      },
    },
    {
      method: "GET",
      path: "/api/profiles",
      title: "Get User Profile",
      description: "Retrieve a user profile by wallet address.",
      queryParams: {
        wallet: "string (required) - Wallet address to lookup",
      },
      responses: {
        200: "Successfully retrieved profile",
        404: "Profile not found", 
        500: "Server error",
      },
      example: {
        request: "?wallet=0x742d35Cc6129C87823D9C5C5d5B8F3E3F8E8F8F8",
        response: {
          success: true,
          profile: {
            id: 1,
            wallet_address: "0x742d35Cc6129C87823D9C5C5d5B8F3E3F8E8F8F8",
            name: "John Doe",
            x_handle: "@johndoe",
            farcaster_handle: "johndoe",
            instagram_handle: "@johndoe",
            is_admin: false,
            created_at: "2024-01-15T10:30:00Z"
          }
        }
      }
    },
    {
      method: "POST",
      path: "/api/profiles",
      title: "Create/Update User Profile",
      description: "Create or update a user profile.",
      requestBody: {
        wallet_address: "string (required) - User's wallet address",
        name: "string (required) - User's display name",
        x_handle: "string (optional) - X/Twitter handle",
        farcaster_handle: "string (optional) - Farcaster handle",
        instagram_handle: "string (optional) - Instagram handle",
      },
      responses: {
        201: "Profile successfully created",
        200: "Profile successfully updated",
        400: "Invalid request",
        500: "Server error",
      },
      example: {
        request: {
          wallet_address: "0x742d35Cc6129C87823D9C5C5d5B8F3E3F8E8F8F8",
          name: "John Doe",
          x_handle: "@johndoe",
          farcaster_handle: "johndoe",
          instagram_handle: "@johndoe"
        },
        response: {
          success: true,
          message: "Profile successfully created",
          profile: {
            id: 1,
            wallet_address: "0x742d35Cc6129C87823D9C5C5d5B8F3E3F8E8F8F8",
            name: "John Doe",
            x_handle: "@johndoe",
            farcaster_handle: "johndoe",
            instagram_handle: "@johndoe",
            is_admin: false,
            created_at: "2024-01-15T10:30:00Z"
          }
        }
      }
    }
  ];

  const metadataSchema = {
    name: "string (required) - Name of the art piece",
    description: "string (optional) - Description of the art piece",
    image: "string (required) - IPFS URL of the image file",
    identification_word: "string (optional) - Unique identifier word",
    attributes: "array (optional) - Array of trait objects",
    "attributes[].trait_type": "string - Name of the trait",
    "attributes[].value": "string|number - Value of the trait",
  };

  const curlExample = `curl -X POST ${baseUrl}/api/art \\
  -H "Content-Type: application/json" \\
  -d '{"ipfs_metadata_url": "ipfs://YOUR_METADATA_HASH"}'`;

  return (
    <div className="min-h-screen bg-[#0D0F11] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13171C] to-[#1A1F25] border-b border-[#1F252B]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <a
              href="/"
              className="p-2 hover:bg-[#1A1F25] rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-[#8C94A6]" />
            </a>
            <div className="p-3 bg-[#0062FF] bg-opacity-20 rounded-lg">
              <Code className="w-8 h-8 text-[#0062FF]" />
            </div>
            <div>
              <h1 className="text-white font-poppins font-bold text-3xl">
                NFT Art API Documentation
              </h1>
              <p className="text-[#8C94A6] font-poppins text-lg mt-2">
                RESTful API for managing NFT art pieces, IPFS integration, and user profiles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#13161F] p-4 rounded-lg">
              <Database className="w-6 h-6 text-[#00C853] mb-2" />
              <div className="text-white font-semibold">Base URL</div>
              <div className="text-[#8C94A6] text-sm font-mono">{baseUrl}</div>
            </div>
            <div className="bg-[#13161F] p-4 rounded-lg">
              <Zap className="w-6 h-6 text-[#FF9500] mb-2" />
              <div className="text-white font-semibold">Content Type</div>
              <div className="text-[#8C94A6] text-sm">application/json</div>
            </div>
            <div className="bg-[#13161F] p-4 rounded-lg">
              <ExternalLink className="w-6 h-6 text-[#60A5FA] mb-2" />
              <div className="text-white font-semibold">IPFS Gateway</div>
              <div className="text-[#8C94A6] text-sm">ipfs.io/ipfs/</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* IPFS Metadata Schema */}
        <section className="mb-12">
          <h2 className="text-white font-poppins font-bold text-2xl mb-6">
            IPFS Metadata Schema
          </h2>
          <div className="bg-[#13161F] rounded-lg p-6">
            <p className="text-[#8C94A6] mb-4">
              Your IPFS metadata.json file should follow this structure:
            </p>
            <div className="bg-[#0D0F11] rounded-lg p-4 mb-4">
              <pre className="text-[#60A5FA] text-sm overflow-x-auto">
                {`{
  "name": "Abstract Digital Art #001",
  "description": "A unique piece of digital abstract art",
  "image": "ipfs://QmNRyRpPkMr8FQX.../image.png",
  "identification_word": "abstract_001",
  "attributes": [
    {
      "trait_type": "Style",
      "value": "Abstract"
    },
    {
      "trait_type": "Rarity", 
      "value": "Rare"
    },
    {
      "trait_type": "Colors",
      "value": 5
    }
  ]
}`}
              </pre>
            </div>
            <div className="space-y-2">
              {Object.entries(metadataSchema).map(([field, description]) => (
                <div
                  key={field}
                  className="flex justify-between py-2 border-b border-[#1F252B] last:border-0"
                >
                  <code className="text-[#60A5FA] text-sm">{field}</code>
                  <span className="text-[#8C94A6] text-sm">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section>
          <h2 className="text-white font-poppins font-bold text-2xl mb-6">
            API Endpoints
          </h2>

          <div className="space-y-8">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="bg-[#13161F] rounded-lg overflow-hidden"
              >
                {/* Endpoint Header */}
                <div className="p-6 border-b border-[#1F252B]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          endpoint.method === "GET"
                            ? "bg-[#00C853] bg-opacity-20 text-[#00C853]"
                            : endpoint.method === "POST"
                              ? "bg-[#2F80FF] bg-opacity-20 text-[#2F80FF]"
                              : "bg-[#FF9500] bg-opacity-20 text-[#FF9500]"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-[#60A5FA] font-mono text-lg">
                        {endpoint.path}
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`${baseUrl}${endpoint.path}`, index)
                      }
                      className="p-2 hover:bg-[#1A1F25] rounded-lg transition-colors duration-200"
                    >
                      {copiedEndpoint === index ? (
                        <Check className="w-4 h-4 text-[#00C853]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#8C94A6]" />
                      )}
                    </button>
                  </div>
                  <h3 className="text-white font-poppins font-semibold text-xl mb-2">
                    {endpoint.title}
                  </h3>
                  <p className="text-[#8C94A6]">{endpoint.description}</p>
                </div>

                {/* Endpoint Details */}
                <div className="p-6 space-y-6">
                  {/* Path Parameters */}
                  {endpoint.pathParams && (
                    <div>
                      <h4 className="text-white font-medium mb-3">
                        Path Parameters
                      </h4>
                      <div className="bg-[#0D0F11] rounded-lg p-4 space-y-2">
                        {Object.entries(endpoint.pathParams).map(
                          ([param, description]) => (
                            <div key={param} className="flex justify-between">
                              <code className="text-[#60A5FA]">{param}</code>
                              <span className="text-[#8C94A6] text-sm">
                                {description}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Query Parameters */}
                  {endpoint.queryParams && (
                    <div>
                      <h4 className="text-white font-medium mb-3">
                        Query Parameters
                      </h4>
                      <div className="bg-[#0D0F11] rounded-lg p-4 space-y-2">
                        {Object.entries(endpoint.queryParams).map(
                          ([param, description]) => (
                            <div key={param} className="flex justify-between">
                              <code className="text-[#60A5FA]">{param}</code>
                              <span className="text-[#8C94A6] text-sm">
                                {description}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div>
                      <h4 className="text-white font-medium mb-3">
                        Request Body
                      </h4>
                      <div className="bg-[#0D0F11] rounded-lg p-4 space-y-2">
                        {Object.entries(endpoint.requestBody).map(
                          ([field, description]) => (
                            <div key={field} className="flex justify-between">
                              <code className="text-[#60A5FA]">{field}</code>
                              <span className="text-[#8C94A6] text-sm">
                                {description}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  <div>
                    <h4 className="text-white font-medium mb-3">Responses</h4>
                    <div className="bg-[#0D0F11] rounded-lg p-4 space-y-2">
                      {Object.entries(endpoint.responses).map(
                        ([status, description]) => (
                          <div key={status} className="flex justify-between">
                            <span
                              className={`font-mono font-semibold ${
                                status.startsWith("2")
                                  ? "text-[#00C853]"
                                  : status.startsWith("4")
                                    ? "text-[#FF9500]"
                                    : "text-[#FF6B6B]"
                              }`}
                            >
                              {status}
                            </span>
                            <span className="text-[#8C94A6] text-sm">
                              {description}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Example */}
                  {endpoint.example && (
                    <div>
                      <h4 className="text-white font-medium mb-3">Example</h4>

                      {/* Request Example */}
                      <div className="mb-4">
                        <h5 className="text-[#8C94A6] text-sm mb-2">
                          Request:
                        </h5>
                        <div className="bg-[#0D0F11] rounded-lg p-4">
                          <pre className="text-[#60A5FA] text-sm overflow-x-auto">
                            {typeof endpoint.example.request === "string"
                              ? `${endpoint.method} ${endpoint.path}${endpoint.example.request}`
                              : `${endpoint.method} ${endpoint.path}\n\n${JSON.stringify(endpoint.example.request, null, 2)}`}
                          </pre>
                        </div>
                      </div>

                      {/* Response Example */}
                      <div>
                        <h5 className="text-[#8C94A6] text-sm mb-2">
                          Response:
                        </h5>
                        <div className="bg-[#0D0F11] rounded-lg p-4">
                          <pre className="text-[#00C853] text-sm overflow-x-auto">
                            {JSON.stringify(endpoint.example.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Test Your API */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-[#0062FF] to-[#4287FF] rounded-lg p-6">
            <h3 className="text-white font-poppins font-semibold text-xl mb-2">
              Ready to Test Your API?
            </h3>
            <p className="text-white opacity-90 mb-4">
              Use tools like Postman, curl, or any HTTP client to test these
              endpoints with your IPFS metadata URLs.
            </p>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <pre className="text-white text-sm overflow-x-auto">
                {curlExample}
              </pre>
            </div>
          </div>
        </section>
      </div>

      {/* Font Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
    </div>
  );
}