"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-custom py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind
          </Link>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/inventory" className="text-base font-medium text-muted hover:text-fg transition-colors">
                Browse
              </Link>
              <Link href="/dashboard/user" className="text-base font-medium text-fg">
                My Reports
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-muted px-3 py-1.5 rounded-lg bg-white/5">
                {user?.email}
              </span>
              {userRole === "admin" && (
                <span className="text-xs bg-utaOrange text-white px-3 py-1.5 rounded-lg font-bold tracking-wide">
                  ADMIN
                </span>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted hover:text-fg transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom section-padding pt-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              You're covered.
            </h1>
            <p className="text-muted">Track your reported items</p>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="btn-primary px-6 py-3 rounded-2xl"
          >
            + Report an item
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
            <p className="text-lg text-muted mb-6">Quiet for now. That's good.</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-secondary"
            >
              Report your first item
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request: any) => (
              <div key={request.id} className="card-base p-6 hover-lift">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 capitalize">
                      {request.attributes.category}
                    </h3>
                    <p className="text-muted leading-relaxed">{request.description}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="text-sm text-muted">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages((prev) => [...prev, ...filesArray]);

      // Generate previews
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
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
        // TODO: Send to Whisper API for transcription
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

    // Validate: minimum 100 characters OR images
    if (description.length > 0 && description.length < 100) {
      alert("Description must be at least 100 characters");
      return;
    }

    if (!description && images.length === 0) {
      alert("Please provide either a description (min 100 chars) or upload images");
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
        onSuccess();
      } else {
        alert("Error submitting report");
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
      <div className="card-base max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-extrabold tracking-tight mb-6">Report an item</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-muted">
                Description
              </label>
              <span className={`text-xs ${description.length >= 100 ? 'text-green-400' : 'text-muted'}`}>
                {description.length}/100 characters {description.length < 100 && '(minimum)'}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Images (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="input-base"
            />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
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
