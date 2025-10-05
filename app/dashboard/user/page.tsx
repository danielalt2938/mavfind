"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageWithLoader from "@/components/ImageWithLoader";
import RequestMatches from "@/components/RequestMatches";

export default function UserDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/requests/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading during auth check or if user is not authenticated
  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-utaOrange"></div>
            {/* Inner pulse effect */}
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-utaOrange/20"></div>
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link href="/inventory" className="text-sm font-medium text-muted hover:text-fg transition-colors">
                Browse Items
              </Link>
              <Link href="/dashboard/user" className="text-sm font-medium text-fg">
                My Reports
              </Link>
            </nav>
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <span className="text-xs text-muted">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="container-custom py-4 space-y-4">
              <Link
                href="/inventory"
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Items
              </Link>
              <Link
                href="/dashboard/user"
                className="block text-sm font-medium text-fg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Reports
              </Link>
              <div className="pt-4 border-t border-border space-y-3">
                <span className="text-xs text-muted block truncate">{user?.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left text-sm font-medium text-muted hover:text-fg transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="container-custom section-padding pt-20 md:pt-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
              My Reports
            </h1>
            <p className="text-sm md:text-base text-muted">Track your lost items and see potential matches we've found</p>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="btn-primary px-6 py-3 rounded-2xl whitespace-nowrap"
          >
            + Report Lost Item
          </button>
        </div>

        {/* Report Form Modal */}
        {showReportForm && (
          <ReportForm
            onClose={() => setShowReportForm(false)}
            onSuccess={() => {
              setShowReportForm(false);
              fetchRequests();
            }}
          />
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="card-base p-12 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto mb-4 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-semibold mb-2">No reports yet</p>
              <p className="text-sm text-muted">Lost something? Report it and we'll help you find it.</p>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-primary px-6 py-3 rounded-2xl"
            >
              Report Your First Item
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request: any) => {
              const images = request.images || [];
              const firstImage = images.length > 0 ? images[0] : null;

              return (
                <div key={request.id} className="card-base overflow-hidden hover-lift h-full">
                  {/* Image Section - Always shown */}
                  <div className="relative w-full h-48 bg-bgElevated overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={request.attributes?.category || "Request image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center border-b border-border">
                        <svg className="w-16 h-16 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={request.status} />
                    </div>
                    {images.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {images.length}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 capitalize">
                          {request.attributes?.subcategory || request.attributes?.category || "Uncategorized"}
                        </h3>
                      </div>
                    </div>

                    <p className="text-muted leading-relaxed mb-4" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {request.attributes?.genericDescription || request.description || "No description"}
                    </p>

                    <div className="text-xs text-muted/70 mb-4 pt-3 border-t border-white/5">
                      Reported {new Date(request.createdAt).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} CST
                    </div>

                    {/* Matches Section */}
                    <RequestMatches 
                      requestId={request.id} 
                      className="mt-4 pt-4 border-t border-white/5" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    submitted: "warning",
    under_review: "info",
    approved: "success",
    matched: "info",
    claimed: "default",
    rejected: "danger",
  };

  const colors: any = {
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    default: "bg-white/10 text-muted border border-white/10",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  const variant = variants[status] || "default";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ReportForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Process each file, converting HEIC to JPEG if needed
      for (const file of filesArray) {
        let processedFile = file;

        // Check if file is HEIC/HEIF and convert to JPEG
        if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9
            });

            // Create a new File from the blob
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
              type: "image/jpeg",
            });
          } catch (error) {
            console.error("Error converting HEIC:", error);
            alert("Error converting HEIC image. Please try a different format.");
            continue;
          }
        }

        setImages((prev) => [...prev, processedFile]);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(processedFile);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    if (isRecording) {
      // Stop recording if already recording
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        // Send to Whisper API for transcription
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            // Append transcription to existing description
            setDescription((prev) => {
              const separator = prev ? " " : "";
              return prev + separator + data.text;
            });
          } else {
            alert("Failed to transcribe audio");
          }
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Error transcribing audio");
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Store recorder to allow manual stop
      (window as any).currentRecorder = mediaRecorder;

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000); // Max 30 seconds
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access required for voice input");
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least description or images
    if (!description && images.length === 0) {
      alert("Please provide a description or upload images");
      return;
    }

    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      if (description) {
        formData.append("description", description);
      }
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        // Close modal and refresh immediately - processing happens in background
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || "Error submitting report");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-base max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-utaOrange border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold mb-2">Processing your report...</h3>
              <p className="text-sm text-muted max-w-sm">
                We're analyzing your item with AI and searching for potential matches. This may take a moment.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-extrabold tracking-tight mb-6">Report Lost Item</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-muted">
                Description (optional)
              </label>
              <span className="text-xs text-muted">
                {description.length} characters
              </span>
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-base pr-12"
                placeholder="Describe what you lost..."
                disabled={isRecording}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-3 top-3 p-3 rounded-xl transition-all duration-300 ${
                  isRecording
                    ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50'
                    : 'bg-bgElevated hover:bg-utaBlue/20 text-muted hover:text-fg hover:scale-105'
                }`}
                title={isRecording ? "Stop recording" : "Record description"}
              >
                {isRecording ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {isRecording && (
              <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-sm text-red-400 font-medium">Recording in progress...</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
                  >
                    Stop
                  </button>
                </div>

                {/* Audio wave animation */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>

                <p className="text-xs text-center text-muted mt-2">
                  Speak clearly into your microphone
                </p>
              </div>
            )}

            {isTranscribing && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                  <span className="text-sm text-blue-400 font-medium">Transcribing audio...</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Images (optional)
            </label>

            <div className="relative">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleImageChange}
                id="image-upload"
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-utaOrange/50 rounded-xl cursor-pointer transition-all hover:bg-bgElevated group"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-10 h-10 text-muted group-hover:text-utaOrange transition-colors"
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
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted group-hover:text-fg transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Supports JPG, PNG, HEIC, HEIF
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">
                    {imagePreviews.length} {imagePreviews.length === 1 ? 'image' : 'images'} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setImagePreviews([]);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <ImageWithLoader
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      onRemove={() => removeImage(index)}
                      showRemoveButton={true}
                      label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
