"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [selectedLocation, setSelectedLocation] = useState<string>("loc1");
  const [activeTab, setActiveTab] = useState<"requests" | "inventory">("requests");
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Data states
  const [requests, setRequests] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    } else if (!authLoading && user && userRole !== "admin") {
      router.push("/dashboard/user");
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

  if (authLoading || (user && userRole === "admin" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-utaOrange/20">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            MavFind <span className="text-utaOrange">Admin</span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/inventory" className="text-muted hover:text-fg transition-colors">
                Browse
              </Link>
              <Link href="/dashboard/admin" className="text-fg font-medium">
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted">
                {user?.email}
              </span>
              <span className="text-xs bg-utaOrange text-white px-2 py-1 rounded-full font-semibold">
                ADMIN
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-muted hover:text-fg transition-colors"
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
            <option value="loc1">Main Campus</option>
            <option value="loc2">North Office</option>
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
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append("locationId", selectedLocation);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add a Lost Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Location: <span className="font-bold">{selectedLocation === "loc1" ? "Main Campus" : "North Office"}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Describe the item found..."
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
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {submitting ? "Adding..." : "Add to Inventory"}
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
