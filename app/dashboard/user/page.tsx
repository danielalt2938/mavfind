"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            MavFind
          </Link>
          <nav className="space-x-4">
            <Link href="/inventory" className="hover:underline">
              Search Inventory
            </Link>
            <Link href="/dashboard/user" className="hover:underline font-semibold">
              My Reports
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Lost Item Reports</h1>
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
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
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't reported any lost items yet.</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="text-blue-600 hover:underline"
            >
              Report your first lost item
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request: any) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {request.attributes.category}
                    </h3>
                    <p className="text-gray-600">{request.description}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="text-sm text-gray-500">
                  Reported on {new Date(request.createdAt).toLocaleDateString()}
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
  const colors: any = {
    submitted: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    matched: "bg-purple-100 text-purple-800",
    claimed: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
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
  const [locationId, setLocationId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least one field (description or images) must be provided
    if (!description && images.length === 0) {
      alert("Please provide either a description or upload images");
      return;
    }

    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append("locationId", locationId);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Report Lost Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Select a location</option>
              <option value="loc1">Main Campus</option>
              <option value="loc2">North Office</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Describe the lost item in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Images (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setImages(e.target.files ? Array.from(e.target.files) : [])
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
