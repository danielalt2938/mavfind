"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Match {
  id: string;
  confidence: number;
  distance: number;
  rank: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lostItem: {
    id: string;
    attributes?: {
      category?: string;
      subcategory?: string;
      brand?: string;
      color?: string;
      model?: string;
      genericDescription?: string;
    };
    images?: string[];
    createdAt: string;
    locationId?: string;
    campus?: string;
    building?: string;
    room?: string;
    location?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      office?: string;
      hours?: string;
    };
  };
}

interface Request {
  id: string;
  title?: string;
  description?: string;
  status: string;
  createdAt: string;
  images?: string[];
  attributes?: {
    category?: string;
    subcategory?: string;
    genericDescription?: string;
  };
}

export default function RequestMatchesPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Helper function to format location ID to display name
  const formatLocationName = (locationId?: string) => {
    if (!locationId) return "Not specified";

    const locationMap: Record<string, string> = {
      university_center: "University Center",
      central_library: "Central Library",
      student_union: "Student Union",
      // Add more locations as needed
    };

    return locationMap[locationId] || locationId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/signin");
      } else if (userRole === "admin") {
        router.replace("/dashboard/admin");
      }
    }
  }, [authLoading, user, userRole, router]);

  useEffect(() => {
    if (user && requestId) {
      fetchRequestAndMatches();
    }
  }, [user, requestId]);

  const fetchRequestAndMatches = async () => {
    try {
      const token = await user?.getIdToken();

      // Fetch request details
      const requestRes = await fetch("/api/requests/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (requestRes.ok) {
        const requestData = await requestRes.json();
        const foundRequest = requestData.requests?.find((r: Request) => r.id === requestId);
        if (foundRequest) {
          setRequest(foundRequest);
        }
      }

      // Fetch matches
      const matchesRes = await fetch(`/api/requests/${requestId}/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        const sortedMatches = (matchesData.matches || []).sort(
          (a: Match, b: Match) => b.confidence - a.confidence
        );
        setMatches(sortedMatches);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9)
      return {
        label: "Excellent",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
      };
    if (confidence >= 0.8)
      return {
        label: "Very Good",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    if (confidence >= 0.7)
      return {
        label: "Good",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
      };
    return {
      label: "Fair",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    };
  };

  const formatTime = (dateString: string) => {
    return (
      new Date(dateString).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) + " CST"
    );
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-utaOrange"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-utaOrange/20"></div>
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/user"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">
                Matches for Your Lost Item
              </h1>
              {request && (
                <p className="text-sm text-muted mt-1">
                  {request.attributes?.subcategory ||
                    request.attributes?.category ||
                    request.title ||
                    "Your request"}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom section-padding pt-8 pb-16">
        {/* Request Summary */}
        {request && (
          <div className="card-base p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              {request.images && request.images.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-full md:w-48 h-48 bg-bgElevated rounded-xl overflow-hidden">
                    <img
                      src={request.images[0]}
                      alt="Your lost item"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3">Your Lost Item</h2>
                <p className="text-muted leading-relaxed mb-4">
                  {request.attributes?.genericDescription ||
                    request.description ||
                    "No description"}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted">Status:</span>{" "}
                    <span className="text-fg font-medium capitalize">
                      {request.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Reported:</span>{" "}
                    <span className="text-fg">{formatTime(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches Section */}
        <div className="mb-6">
          {matches.length === 0 ? (
            <div className="card-base p-12 text-center">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-muted/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-lg font-semibold mb-2">No matches found yet</p>
              <p className="text-sm text-muted max-w-md mx-auto">
                We're continuously scanning our database for potential matches. Check back
                later or contact UTA Lost & Found directly.
              </p>
            </div>
          ) : (
            <>
              {/* Best Match - Large Card */}
              {matches.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <svg
                      className="w-6 h-6 text-utaOrange"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h2 className="text-2xl md:text-3xl font-bold">Best Match</h2>
                  </div>

                  <BestMatchCard
                    match={matches[0]}
                    onViewDetails={() => setSelectedMatch(matches[0])}
                  />
                </div>
              )}

              {/* Other Matches - Small Cards */}
              {matches.length > 1 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Other Matches</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.slice(1).map((match, index) => (
                      <OtherMatchCard
                        key={match.id}
                        match={match}
                        index={index}
                        onViewDetails={() => setSelectedMatch(match)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

function BestMatchCard({
  match,
  onViewDetails,
}: {
  match: Match;
  onViewDetails: () => void;
}) {
  const formatLocationName = (locationId?: string) => {
    if (!locationId) return "Not specified";

    const locationMap: Record<string, string> = {
      university_center: "University Center",
      central_library: "Central Library",
      student_union: "Student Union",
    };

    return locationMap[locationId] || locationId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9)
      return {
        label: "Excellent",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
      };
    if (confidence >= 0.8)
      return {
        label: "Very Good",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    if (confidence >= 0.7)
      return {
        label: "Good",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
      };
    return {
      label: "Fair",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    };
  };

  const formatTime = (dateString: string) => {
    return (
      new Date(dateString).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) + " CST"
    );
  };

  const confidenceInfo = getConfidenceLevel(match.confidence);
  const images = match.lostItem.images || [];
  const firstImage = images.length > 0 ? images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base overflow-hidden hover-lift ring-2 ring-utaOrange/40 shadow-xl shadow-utaOrange/10"
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-utaOrange via-yellow-400 to-utaOrange"></div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Section */}
          <div className="flex-shrink-0">
            <div className="relative w-full lg:w-80 h-64 lg:h-80 bg-bgElevated rounded-xl overflow-hidden">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt="Found item"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-muted/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm font-semibold flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {images.length}
                </div>
              )}

              <div className="absolute top-3 left-3">
                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${confidenceInfo.bg} ${confidenceInfo.color} border ${confidenceInfo.border} backdrop-blur-sm`}
                >
                  {Math.round(match.confidence * 100)}% Match
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-2xl md:text-3xl font-bold capitalize mb-2">
                {match.lostItem.attributes?.subcategory ||
                  match.lostItem.attributes?.category ||
                  "Item"}
              </h3>
              {match.lostItem.attributes?.brand && (
                <p className="text-lg text-muted mb-3">
                  {match.lostItem.attributes.brand}
                </p>
              )}
            </div>

            <p className="text-base text-muted leading-relaxed mb-6">
              {match.lostItem.attributes?.genericDescription ||
                "No description available"}
            </p>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {match.lostItem.attributes?.color && (
                <div>
                  <span className="text-sm font-medium text-muted">Color:</span>
                  <p className="text-fg font-medium">
                    {match.lostItem.attributes.color}
                  </p>
                </div>
              )}
              {match.lostItem.attributes?.model && (
                <div>
                  <span className="text-sm font-medium text-muted">Model:</span>
                  <p className="text-fg font-medium">
                    {match.lostItem.attributes.model}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted">Location:</span>
                <p className="text-fg font-medium">
                  {formatLocationName(match.lostItem.locationId)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted">Found:</span>
                <p className="text-fg font-medium">
                  {formatTime(match.lostItem.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div>
              <button
                onClick={onViewDetails}
                className="btn-primary px-8 py-3 rounded-xl text-base font-semibold w-full sm:w-auto"
              >
                View Pickup Location & Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Info Footer */}
      <div className="px-4 sm:px-6 py-3 bg-utaOrange/5 border-t border-utaOrange/10 text-xs text-muted">
        Matched on {formatTime(match.createdAt)}
      </div>
    </motion.div>
  );
}

function OtherMatchCard({
  match,
  index,
  onViewDetails,
}: {
  match: Match;
  index: number;
  onViewDetails: () => void;
}) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      day: "numeric",
    });
  };

  const images = match.lostItem.images || [];
  const firstImage = images.length > 0 ? images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onViewDetails}
      className="card-base overflow-hidden hover-lift cursor-pointer group"
    >
      {/* Image */}
      <div className="relative w-full h-40 bg-bgElevated overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt="Found item"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-muted/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-semibold">
            +{images.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="text-lg font-bold capitalize mb-1 line-clamp-1">
          {match.lostItem.attributes?.subcategory ||
            match.lostItem.attributes?.category ||
            "Item"}
        </h4>

        {match.lostItem.attributes?.brand && (
          <p className="text-sm text-muted mb-2 line-clamp-1">
            {match.lostItem.attributes.brand}
          </p>
        )}

        <p className="text-sm text-muted line-clamp-2 mb-3">
          {match.lostItem.attributes?.genericDescription || "No description"}
        </p>

        <div className="flex items-center justify-between text-xs text-muted border-t border-white/5 pt-3">
          <span>Found {formatTime(match.lostItem.createdAt)}</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function MatchDetailsModal({
  match,
  onClose,
}: {
  match: Match;
  onClose: () => void;
}) {
  const formatLocationName = (locationId?: string) => {
    if (!locationId) return "Not specified";

    const locationMap: Record<string, string> = {
      university_center: "University Center",
      central_library: "Central Library",
      student_union: "Student Union",
    };

    return locationMap[locationId] || locationId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9)
      return {
        label: "Excellent",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
      };
    if (confidence >= 0.8)
      return {
        label: "Very Good",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    if (confidence >= 0.7)
      return {
        label: "Good",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
      };
    return {
      label: "Fair",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    };
  };

  const confidenceInfo = getConfidenceLevel(match.confidence);
  const images = match.lostItem.images || [];

  const formatTime = (dateString: string) => {
    return (
      new Date(dateString).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) + " CST"
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="card-base max-w-5xl w-full my-8 relative"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {match.lostItem.attributes?.subcategory ||
                match.lostItem.attributes?.category ||
                "Item"}{" "}
              Details
            </h2>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${confidenceInfo.bg} ${confidenceInfo.color} border ${confidenceInfo.border}`}
            >
              {confidenceInfo.label} Match ({Math.round(match.confidence * 100)}%)
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Images Section */}
            <div>
              <h3 className="text-lg font-bold mb-4">Item Photos</h3>
              {images.length > 0 ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-bgElevated rounded-xl overflow-hidden">
                    <img
                      src={images[0]}
                      alt="Main item photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-bgElevated rounded-lg overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`Item photo ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-bgElevated rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 text-muted/30 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-muted">No photos available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Item Details */}
              <div>
                <h3 className="text-lg font-bold mb-4">Item Information</h3>
                <div className="space-y-3">
                  {match.lostItem.attributes?.brand && (
                    <div>
                      <span className="text-sm font-medium text-muted">Brand:</span>
                      <p className="text-fg">{match.lostItem.attributes.brand}</p>
                    </div>
                  )}
                  {match.lostItem.attributes?.color && (
                    <div>
                      <span className="text-sm font-medium text-muted">Color:</span>
                      <p className="text-fg">{match.lostItem.attributes.color}</p>
                    </div>
                  )}
                  {match.lostItem.attributes?.model && (
                    <div>
                      <span className="text-sm font-medium text-muted">Model:</span>
                      <p className="text-fg">{match.lostItem.attributes.model}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted">Description:</span>
                    <p className="text-fg leading-relaxed">
                      {match.lostItem.attributes?.genericDescription ||
                        "No description available"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted">Found:</span>
                    <p className="text-fg">{formatTime(match.lostItem.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Pickup Information - Enhanced */}
              <div className="bg-gradient-to-br from-utaOrange/10 to-utaBlue/10 border-2 border-utaOrange/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-utaOrange/20 rounded-lg">
                    <svg
                      className="w-6 h-6 text-utaOrange"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-fg">Visit This Location to Claim</h3>
                    <p className="text-sm text-muted">Bring a valid ID to verify ownership</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-bg/50 rounded-lg p-4 border border-white/5">
                    <span className="text-sm font-medium text-muted block mb-1">Pickup Location:</span>
                    <p className="text-lg font-bold text-utaOrange">
                      {formatLocationName(match.lostItem.locationId)}
                    </p>
                  </div>

                  {match.lostItem.contactInfo?.office && (
                    <div>
                      <span className="text-sm font-medium text-muted">Office:</span>
                      <p className="text-fg">{match.lostItem.contactInfo.office}</p>
                    </div>
                  )}

                  {match.lostItem.contactInfo?.hours && (
                    <div>
                      <span className="text-sm font-medium text-muted">Hours:</span>
                      <p className="text-fg">{match.lostItem.contactInfo.hours}</p>
                    </div>
                  )}

                  {match.lostItem.contactInfo?.email && (
                    <div>
                      <span className="text-sm font-medium text-muted">Email:</span>
                      <p className="text-fg">
                        <a
                          href={`mailto:${match.lostItem.contactInfo.email}`}
                          className="text-utaOrange hover:underline"
                        >
                          {match.lostItem.contactInfo.email}
                        </a>
                      </p>
                    </div>
                  )}

                  {match.lostItem.contactInfo?.phone && (
                    <div>
                      <span className="text-sm font-medium text-muted">Phone:</span>
                      <p className="text-fg">
                        <a
                          href={`tel:${match.lostItem.contactInfo.phone}`}
                          className="text-utaOrange hover:underline"
                        >
                          {match.lostItem.contactInfo.phone}
                        </a>
                      </p>
                    </div>
                  )}

                  {!match.lostItem.contactInfo?.email &&
                    !match.lostItem.contactInfo?.phone && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-400 mb-2">
                          <strong>Contact UTA Lost & Found:</strong>
                        </p>
                        <p className="text-sm text-fg">
                          📧{" "}
                          <a
                            href="mailto:lostandfound@uta.edu"
                            className="text-utaOrange hover:underline"
                          >
                            lostandfound@uta.edu
                          </a>
                          <br />
                          📞{" "}
                          <a
                            href="tel:817-272-7777"
                            className="text-utaOrange hover:underline"
                          >
                            817-272-7777
                          </a>
                          <br />
                          📍 Student Union Building, Room 200
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-white/5 mt-8">
            <button onClick={onClose} className="btn-secondary w-full py-3">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
