"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [selectedLocation, setSelectedLocation] = useState<string>("university_center");
  const [activeTab, setActiveTab] = useState<"requests" | "inventory">("requests");
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/signin");
      } else if (userRole !== "admin") {
        router.replace("/dashboard/user");
      }
    }
  }, [authLoading, user, userRole, router]);

  useEffect(() => {
    if (user && userRole === "admin" && selectedLocation) {
      fetchData();
    }
  }, [user, userRole, selectedLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch requests, found items, and stats in parallel
      const [requestsRes, itemsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/requests?locationId=${selectedLocation}`, { headers }),
        fetch(`/api/admin/lost/items?locationId=${selectedLocation}`, { headers }),
        fetch(`/api/admin/stats?locationId=${selectedLocation}`, { headers }),
      ]);

      const [requestsData, itemsData, statsData] = await Promise.all([
        requestsRes.json(),
        itemsRes.json(),
        statsRes.json(),
      ]);

      setRequests(requestsData.requests || []);
      setFoundItems(itemsData.items || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/requests/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request");
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/lost/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, status }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        alert("Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Error updating item status");
    }
  };

  // Show loading during auth check or while fetching data
  if (authLoading || !user || userRole !== "admin" || (user && userRole === "admin" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-utaOrange/20">
        <div className="container-custom py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind <span className="text-utaOrange">Admin</span>
          </Link>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/inventory" className="text-base font-medium text-muted hover:text-fg transition-colors">
                Browse
              </Link>
              <Link href="/dashboard/admin" className="text-base font-medium text-fg">
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-muted px-3 py-1.5 rounded-lg bg-white/5">
                {user?.email}
              </span>
              <span className="text-xs bg-utaOrange text-white px-3 py-1.5 rounded-lg font-bold tracking-wide">
                ADMIN
              </span>
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
        {/* Location Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-muted mb-3">Active Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="input-base max-w-xs"
          >
            <option value="university_center">University Center</option>
            <option value="central_library">Central Library</option>
          </select>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Pending Requests
              </h3>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendingRequests}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Total Requests
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalRequests}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Inventory Items
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.foundItems}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Claimed Items
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {stats.claimedItems}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "requests"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            User Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "inventory"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Inventory ({foundItems.length})
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowAddItemForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            + Add to Inventory
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === "requests" ? (
            <RequestsTable
              requests={requests}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <InventoryTable
              items={foundItems}
              onUpdateStatus={handleUpdateItemStatus}
            />
          )}
        </div>
      </div>

      {/* Add Item Form Modal */}
      {showAddItemForm && (
        <AddFoundItemForm
          selectedLocation={selectedLocation}
          onClose={() => setShowAddItemForm(false)}
          onSuccess={() => {
            setShowAddItemForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function RequestsTable({
  requests,
  onApprove,
  onReject,
}: {
  requests: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        No requests found for this location.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(request.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {request.attributes.category}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {request.description.substring(0, 100)}
                {request.description.length > 100 ? "..." : ""}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {request.status === "submitted" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(request.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(request.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTable({
  items,
  onUpdateStatus,
}: {
  items: any[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        No inventory items for this location.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date Found
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {item.attributes.category}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {item.description.substring(0, 100)}
                {item.description.length > 100 ? "..." : ""}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ItemStatusBadge status={item.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <select
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="found">Found</option>
                  <option value="claimed">Claimed</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    submitted: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const colors: any = {
    found: "bg-green-100 text-green-800",
    claimed: "bg-purple-100 text-purple-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

function AddFoundItemForm({
  selectedLocation,
  onClose,
  onSuccess,
}: {
  selectedLocation: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [location, setLocation] = useState(selectedLocation);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append("locationId", location);
      formData.append("description", description);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/admin/lost", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Error adding found item");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding found item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold mb-2">Processing item...</h3>
              <p className="text-sm text-gray-600 max-w-sm">
                We're analyzing your submission with AI to categorize and match the item.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Found Item</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Office Location <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
            >
              <option value="university_center">University Center</option>
              <option value="central_library">Central Library</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Select the office where this item is currently stored
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
              placeholder="Describe the found item in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Images (optional)
            </label>

            <div className="relative">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleImageChange}
                id="admin-image-upload"
                className="hidden"
              />
              <label
                htmlFor="admin-image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-xl cursor-pointer transition-all hover:bg-purple-50 group"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-10 h-10 text-gray-400 group-hover:text-purple-600 transition-colors"
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
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, HEIC, HEIF
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {imagePreviews.length} {imagePreviews.length === 1 ? 'image' : 'images'} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setImagePreviews([]);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl z-10" />
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div className="text-xs text-white font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                          Image {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 disabled:bg-gray-400 font-medium transition-all hover:shadow-lg disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add to Inventory"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
