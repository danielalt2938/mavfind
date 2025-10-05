"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";

interface Match {
  id: string;
  confidence: number;
  distance: number;
  rank: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  confidenceRank?: number;
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

interface RequestMatchesProps {
  requestId: string;
  className?: string;
}

export default function RequestMatches({ requestId, className = "" }: RequestMatchesProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (user && requestId) {
      fetchMatches();
    }
  }, [user, requestId]);

  const fetchMatches = async () => {
    try {
      console.log(`Fetching matches for request: ${requestId}`);
      const token = await user?.getIdToken();
      const res = await fetch(`/api/requests/${requestId}/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log(`Matches API response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Matches API response:', data);
        console.log(`Received ${data.matches?.length || 0} matches`);
        
        // Sort matches by confidence (highest first) and assign ranking
        const sortedMatches = (data.matches || []).sort((a: Match, b: Match) => b.confidence - a.confidence);
        const rankedMatches = sortedMatches.map((match: Match, index: number) => ({
          ...match,
          confidenceRank: index + 1
        }));
        console.log(`Processed ${rankedMatches.length} ranked matches`);
        setMatches(rankedMatches);
      } else {
        const errorData = await res.json();
        console.error('Matches API error:', res.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return { label: "Excellent", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
    if (confidence >= 0.8) return { label: "Very Good", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    if (confidence >= 0.7) return { label: "Good", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    return { label: "Fair", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CST';
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-utaOrange border-t-transparent"></div>
          <span className="text-sm text-muted">Finding matches...</span>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-muted mb-1">No matches yet</p>
            <p className="text-xs text-muted/70">We're continuously scanning for matches. Check back soon!</p>
          </div>
        </div>
      </div>
    );
  }

  const topMatch = matches[0];
  const remainingMatches = matches.slice(1);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-utaOrange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-bold">
            {matches.length === 1 ? "1 Match Found" : `${matches.length} Matches Found`}
          </h3>
        </div>
        
        {matches.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-utaOrange hover:text-utaOrange/80 transition-colors font-medium"
          >
            {expanded ? "Show Less" : "View All"}
          </button>
        )}
      </div>

      {/* Top Match */}
      <MatchCard 
        match={topMatch} 
        isTopMatch={true} 
        onViewDetails={() => setSelectedMatch(topMatch)}
      />

      {/* Additional Matches */}
      <AnimatePresence>
        {expanded && remainingMatches.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 mt-4"
          >
            {remainingMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isTopMatch={false} 
                onViewDetails={() => setSelectedMatch(match)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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

function MatchCard({ match, isTopMatch, onViewDetails }: { match: Match; isTopMatch: boolean; onViewDetails: () => void }) {
  const confidenceInfo = getConfidenceLevel(match.confidence);
  const images = match.lostItem.images || [];
  const firstImage = images.length > 0 ? images[0] : null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CST';
  };

  return (
    <Card 
      hover={true} 
      className={`relative overflow-hidden ${isTopMatch ? 'ring-2 ring-utaOrange/30' : ''}`}
    >
      {isTopMatch && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-utaOrange to-yellow-400"></div>
      )}
      
      <div className="flex gap-6">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 bg-bgElevated rounded-xl overflow-hidden">
            {firstImage ? (
              <img
                src={firstImage}
                alt="Found item"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {images.length > 1 && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                +{images.length - 1}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-bold capitalize">
                  {match.lostItem.attributes?.subcategory || match.lostItem.attributes?.category || "Item"}
                </h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isTopMatch 
                    ? 'bg-utaOrange/10 text-utaOrange border border-utaOrange/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {isTopMatch ? 'Best Match' : `#${match.confidenceRank} Match`}
                </span>
              </div>
              
              {match.lostItem.attributes?.brand && (
                <p className="text-sm text-muted mb-2">{match.lostItem.attributes.brand}</p>
              )}
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${confidenceInfo.bg} ${confidenceInfo.color} border ${confidenceInfo.border} mb-1`}>
                {confidenceInfo.label} ({Math.round(match.confidence * 100)}%)
              </div>
              <div className="text-xs text-muted">
                Confidence Rank #{match.confidenceRank}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed mb-4" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {match.lostItem.attributes?.genericDescription || "No description available"}
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted font-medium">Location:</span>
              <p className="text-fg">
                {[match.lostItem.campus, match.lostItem.building, match.lostItem.room]
                  .filter(Boolean)
                  .join(", ") || "Not specified"}
              </p>
            </div>
            <div>
              <span className="text-muted font-medium">Found:</span>
              <p className="text-fg">{formatTime(match.lostItem.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="text-xs text-muted">
          Matched {formatTime(match.createdAt)}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onViewDetails}
            className="btn-secondary text-sm px-4 py-2"
          >
            View Details & Pickup Info
          </button>
          <button 
            onClick={onViewDetails}
            className="btn-primary text-sm px-4 py-2"
          >
            Claim This Item
          </button>
        </div>
      </div>
    </Card>
  );
}

function MatchDetailsModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const confidenceInfo = getConfidenceLevel(match.confidence);
  const images = match.lostItem.images || [];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CST';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="card-base max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Match Details - {match.lostItem.attributes?.subcategory || match.lostItem.attributes?.category || "Item"}
            </h2>
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${confidenceInfo.bg} ${confidenceInfo.color} border ${confidenceInfo.border}`}>
                {confidenceInfo.label} ({Math.round(match.confidence * 100)}%)
              </div>
              <span className="text-sm text-muted">
                Confidence Rank #{match.confidenceRank} of all matches
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                        <div key={index} className="aspect-square bg-bgElevated rounded-lg overflow-hidden">
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
                    <svg className="w-16 h-16 text-muted/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                      {match.lostItem.attributes?.genericDescription || "No description available"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted">Found:</span>
                    <p className="text-fg">{formatTime(match.lostItem.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Pickup Information */}
              <div className="bg-utaOrange/5 border border-utaOrange/20 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-utaOrange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pickup Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted">Location:</span>
                    <p className="text-fg font-medium">
                      {[match.lostItem.campus, match.lostItem.building, match.lostItem.room]
                        .filter(Boolean)
                        .join(", ") || match.lostItem.location || "Contact for location details"}
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
                        <a href={`mailto:${match.lostItem.contactInfo.email}`} 
                           className="text-utaOrange hover:underline">
                          {match.lostItem.contactInfo.email}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {match.lostItem.contactInfo?.phone && (
                    <div>
                      <span className="text-sm font-medium text-muted">Phone:</span>
                      <p className="text-fg">
                        <a href={`tel:${match.lostItem.contactInfo.phone}`} 
                           className="text-utaOrange hover:underline">
                          {match.lostItem.contactInfo.phone}
                        </a>
                      </p>
                    </div>
                  )}

                  {/* Default contact if no specific contact info */}
                  {!match.lostItem.contactInfo?.email && !match.lostItem.contactInfo?.phone && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-sm text-blue-400 mb-2">
                        <strong>Contact UTA Lost & Found:</strong>
                      </p>
                      <p className="text-sm text-fg">
                        📧 <a href="mailto:lostandfound@uta.edu" className="text-utaOrange hover:underline">lostandfound@uta.edu</a><br/>
                        📞 <a href="tel:817-272-7777" className="text-utaOrange hover:underline">817-272-7777</a><br/>
                        📍 Student Union Building, Room 200
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Information */}
              <div>
                <h3 className="text-lg font-bold mb-4">Match Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted">Confidence Score:</span>
                    <p className="text-fg">{Math.round(match.confidence * 100)}% - {confidenceInfo.label}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted">Match Rank:</span>
                    <p className="text-fg">#{match.confidenceRank} of all potential matches</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted">Matched:</span>
                    <p className="text-fg">{formatTime(match.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/5 mt-8">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Close
            </button>
            <button className="btn-primary flex-1">
              I Want to Claim This Item
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.9) return { label: "Excellent", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
  if (confidence >= 0.8) return { label: "Very Good", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  if (confidence >= 0.7) return { label: "Good", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
  return { label: "Fair", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
}