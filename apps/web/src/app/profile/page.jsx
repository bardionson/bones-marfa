"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { account, isConnected, connect, formatAddress } = useWallet();

  const [formData, setFormData] = useState({
    name: "",
    xHandle: "",
    farcasterHandle: "",
    instagramHandle: "",
  });
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch user profile
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile", account],
    queryFn: async () => {
      const response = await fetch(`/api/profiles?wallet=${account}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!account && isConnected,
  });

  const profile = profileData?.profile;

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        xHandle: profile.x_handle || "",
        farcasterHandle: profile.farcaster_handle || "",
        instagramHandle: profile.instagram_handle || "",
      });
    }
  }, [profile]);

  // Save profile mutation
  const saveMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account,
          requestorWallet: account, // Add requestor wallet for authorization
          ...profileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setSaveError(error.message);
      setSaveSuccess(false);
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setSaveError("Name is required");
      return;
    }

    saveMutation.mutate(formData);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0D0F11] text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-[#6B7683] mx-auto mb-4" />
          <h2 className="text-white font-semibold text-2xl mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-[#8C94A6] mb-6">
            You need to connect your wallet to manage your profile
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-[#0062FF] hover:bg-[#1a72ff] text-white rounded-lg transition-colors duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F11] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#13171C] bg-opacity-90 backdrop-blur-sm border-b border-[#1F252B] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="p-2 hover:bg-[#1A1F25] rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-[#8C94A6]" />
            </a>
            <div>
              <h1 className="text-white font-semibold text-lg">Profile</h1>
              <p className="text-[#8C94A6] text-sm">
                Connected: {formatAddress(account)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Failed to load profile</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="bg-[#13161F] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0062FF] to-[#4287FF] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-2xl">
                  Your Profile
                </h2>
                <p className="text-[#8C94A6] text-sm">
                  Customize how you appear to other collectors
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-white font-medium text-sm mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-3 bg-[#1A1F25] border border-[#1F252B] rounded-lg text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Social Handles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium text-sm mb-2">
                    X Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7683]">
                      @
                    </span>
                    <input
                      type="text"
                      value={formData.xHandle}
                      onChange={(e) =>
                        handleInputChange("xHandle", e.target.value)
                      }
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-3 bg-[#1A1F25] border border-[#1F252B] rounded-lg text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium text-sm mb-2">
                    Farcaster Handle
                  </label>
                  <input
                    type="text"
                    value={formData.farcasterHandle}
                    onChange={(e) =>
                      handleInputChange("farcasterHandle", e.target.value)
                    }
                    placeholder="username"
                    className="w-full px-4 py-3 bg-[#1A1F25] border border-[#1F252B] rounded-lg text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium text-sm mb-2">
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7683]">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.instagramHandle}
                    onChange={(e) =>
                      handleInputChange("instagramHandle", e.target.value)
                    }
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-3 bg-[#1A1F25] border border-[#1F252B] rounded-lg text-white placeholder-[#6B7683] focus:outline-none focus:ring-2 focus:ring-[#0062FF] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {saveError && (
              <div className="flex items-center space-x-2 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center space-x-2 p-3 bg-[#00C853] bg-opacity-10 border border-[#00C853] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#00C853]" />
                <span className="text-[#00C853] text-sm">
                  Profile saved successfully!
                </span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || !formData.name.trim()}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  saveMutation.isPending || !formData.name.trim()
                    ? "bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0062FF] to-[#4287FF] hover:from-[#1a72ff] hover:to-[#5ba3ff] text-white active:scale-95"
                }`}
              >
                <Save className="w-5 h-5" />
                <span>
                  {saveMutation.isPending ? "Saving..." : "Save Profile"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
