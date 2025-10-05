"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, Configure } from "react-instantsearch";
import ImageWithLoader from "@/components/ImageWithLoader";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

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

  // Search states
  const [useSearchRequests, setUseSearchRequests] = useState(false);
  const [useSearchInventory, setUseSearchInventory] = useState(false);

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
        fetch(`/api/admin/requests`, { headers }), // Fetch all requests
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
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
        <div className="container-custom py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors">
            MavFind
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/inventory" className="text-base font-medium text-muted hover:text-fg transition-colors">
                Browse
              </Link>
              <Link href="/dashboard/admin" className="text-base font-medium text-fg">
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted">
                {user?.email}
              </span>
              <span className="text-xs bg-utaOrange text-white px-2.5 py-1 rounded-md font-semibold">
                ADMIN
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted hover:text-fg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom pt-32 pb-20 px-4 md:px-6">
        {/* Page Title & Location */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3">
            Dashboard.
          </h1>
          <p className="text-xl text-muted mb-8">
            Manage lost items. Help Mavericks reconnect.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-muted mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input-base w-full"
              >
                <option value="university_center">University Center</option>
                <option value="central_library">Central Library</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="btn-primary px-6 py-3 rounded-2xl whitespace-nowrap"
            >
              + Add Found Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="card-base p-6 hover-lift">
              <div className="text-sm font-medium text-muted mb-2">
                Pending
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1">
                {stats.pendingRequests}
              </div>
              <div className="text-xs text-muted">
                Awaiting review
              </div>
            </div>
            <div className="card-base p-6 hover-lift">
              <div className="text-sm font-medium text-muted mb-2">
                Requests
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1">
                {stats.totalRequests}
              </div>
              <div className="text-xs text-muted">
                Total submissions
              </div>
            </div>
            <div className="card-base p-6 hover-lift">
              <div className="text-sm font-medium text-muted mb-2">
                Inventory
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1">
                {stats.foundItems}
              </div>
              <div className="text-xs text-muted">
                Items in stock
              </div>
            </div>
            <div className="card-base p-6 hover-lift">
              <div className="text-sm font-medium text-muted mb-2">
                Reunited
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1">
                {stats.claimedItems}
              </div>
              <div className="text-xs text-muted">
                Successfully claimed
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "requests"
                ? "bg-fg text-bg"
                : "bg-bgElevated text-muted hover:text-fg hover:bg-white/10"
            }`}
          >
            Requests
            <span className="ml-2 opacity-60">({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "inventory"
                ? "bg-fg text-bg"
                : "bg-bgElevated text-muted hover:text-fg hover:bg-white/10"
            }`}
          >
            Inventory
            <span className="ml-2 opacity-60">({foundItems.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="card-base overflow-hidden">
          {activeTab === "requests" ? (
            useSearchRequests ? (
              <InstantSearch
                searchClient={searchClient}
                indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME_REQUEST || "mavfind_lost_items_requests"}
              >
                <div className="p-6 border-b border-border">
                  <SearchBox
                    placeholder="Search requests..."
                    classNames={{
                      root: "w-full",
                      form: "relative",
                      input: "input-base w-full pl-12 pr-4",
                      submit: "absolute left-4 top-1/2 -translate-y-1/2",
                      reset: "absolute right-4 top-1/2 -translate-y-1/2",
                      loadingIndicator: "absolute right-4 top-1/2 -translate-y-1/2",
                    }}
                  />
                  <button
                    onClick={() => setUseSearchRequests(false)}
                    className="mt-3 text-sm text-muted hover:text-fg transition-colors"
                  >
                    ← Back to all requests
                  </button>
                </div>
                <Configure hitsPerPage={50} />
                <Hits
                  hitComponent={({ hit }) => (
                    <RequestHitComponent
                      hit={hit}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )}
                  classNames={{
                    root: "divide-y divide-border",
                    list: "divide-y divide-border",
                    item: "hover:bg-bgElevated transition-colors",
                  }}
                />
              </InstantSearch>
            ) : (
              <>
                <div className="p-6 border-b border-border">
                  <button
                    onClick={() => setUseSearchRequests(true)}
                    className="btn-secondary px-4 py-2 rounded-xl text-sm"
                  >
                    🔍 Search Requests
                  </button>
                </div>
                <RequestsTable
                  requests={requests}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </>
            )
          ) : useSearchInventory ? (
            <InstantSearch
              searchClient={searchClient}
              indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME_INVENTORY || "mavfind_lost_items"}
            >
              <div className="p-6 border-b border-border">
                <SearchBox
                  placeholder="Search inventory..."
                  classNames={{
                    root: "w-full",
                    form: "relative",
                    input: "input-base w-full pl-12 pr-4",
                    submit: "absolute left-4 top-1/2 -translate-y-1/2",
                    reset: "absolute right-4 top-1/2 -translate-y-1/2",
                    loadingIndicator: "absolute right-4 top-1/2 -translate-y-1/2",
                  }}
                />
                <button
                  onClick={() => setUseSearchInventory(false)}
                  className="mt-3 text-sm text-muted hover:text-fg transition-colors"
                >
                  ← Back to all items
                </button>
              </div>
              <Configure hitsPerPage={50} filters={`locationId:${selectedLocation}`} />
              <Hits
                hitComponent={({ hit }) => (
                  <InventoryHitComponent
                    hit={hit}
                    onUpdateStatus={handleUpdateItemStatus}
                  />
                )}
                classNames={{
                  root: "divide-y divide-border",
                  list: "divide-y divide-border",
                  item: "hover:bg-bgElevated transition-colors",
                }}
              />
            </InstantSearch>
          ) : (
            <>
              <div className="p-6 border-b border-border">
                <button
                  onClick={() => setUseSearchInventory(true)}
                  className="btn-secondary px-4 py-2 rounded-xl text-sm"
                >
                  🔍 Search Inventory
                </button>
              </div>
              <InventoryTable
                items={foundItems}
                onUpdateStatus={handleUpdateItemStatus}
              />
            </>
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

// Hit components for Algolia search
function RequestHitComponent({
  hit,
  onApprove,
  onReject,
}: {
  hit: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span className="text-sm font-medium capitalize">
              {hit.attributes?.category || "Unknown"}
            </span>
            <span className="text-sm text-muted ml-3">
              {new Date(hit.createdAt).toLocaleDateString()}
            </span>
          </div>
          <StatusBadge status={hit.status} />
        </div>
        <p className="text-sm text-fg line-clamp-2">{hit.description}</p>
      </div>
      {hit.status === "submitted" && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onApprove(hit.objectID)}
            className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors text-sm"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(hit.objectID)}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors text-sm"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function InventoryHitComponent({
  hit,
  onUpdateStatus,
}: {
  hit: any;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span className="text-sm font-medium capitalize">
              {hit.attributes?.category || "Unknown"}
            </span>
            <span className="text-sm text-muted ml-3">
              {new Date(hit.createdAt).toLocaleDateString()}
            </span>
          </div>
          <ItemStatusBadge status={hit.status} />
        </div>
        <p className="text-sm text-fg line-clamp-2">{hit.description}</p>
      </div>
      <div className="shrink-0">
        <select
          value={hit.status}
          onChange={(e) => onUpdateStatus(hit.objectID, e.target.value)}
          className="input-base py-2 px-3 text-sm"
        >
          <option value="found">Found</option>
          <option value="claimed">Claimed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
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
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-20">📋</div>
        <p className="text-lg text-muted">No requests yet.</p>
        <p className="text-sm text-muted mt-2">New submissions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-bgElevated transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                {new Date(request.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                {request.attributes.category}
              </td>
              <td className="px-6 py-4 text-sm text-fg max-w-md">
                <div className="line-clamp-2">
                  {request.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {request.status === "submitted" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(request.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(request.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors"
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
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-20">📦</div>
        <p className="text-lg text-muted">Inventory empty.</p>
        <p className="text-sm text-muted mt-2">Add found items to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Date Found
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-bgElevated transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                {item.attributes.category}
              </td>
              <td className="px-6 py-4 text-sm text-fg max-w-md">
                <div className="line-clamp-2">
                  {item.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ItemStatusBadge status={item.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <select
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                  className="input-base py-2 px-3 text-sm"
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
  const variants: any = {
    submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    under_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    approved: "bg-green-500/10 text-green-600 border-green-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
        variants[status] || "bg-white/10 text-muted border-white/10"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const variants: any = {
    found: "bg-green-500/10 text-green-600 border-green-500/20",
    claimed: "bg-utaOrange/10 text-utaOrange border-utaOrange/20",
    archived: "bg-white/10 text-muted border-white/10",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
        variants[status] || "bg-white/10 text-muted border-white/10"
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

      (window as any).currentRecorder = mediaRecorder;

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000);
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
      <div className="card-base max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-utaOrange border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold mb-2">Processing item...</h3>
              <p className="text-sm text-muted max-w-sm">
                We're analyzing your submission with AI to categorize and match the item.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 tracking-tight">Add Found Item</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Office Location <span className="text-utaOrange">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="input-base w-full"
            >
              <option value="university_center">University Center</option>
              <option value="central_library">Central Library</option>
            </select>
            <p className="text-xs text-muted mt-2">
              Select the office where this item is currently stored
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Description <span className="text-utaOrange">*</span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="input-base w-full pr-14"
                placeholder="Describe the found item in detail..."
                disabled={isRecording}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-3 top-3 p-3 rounded-xl transition-all duration-300 ${
                  isRecording
                    ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50'
                    : 'bg-bgElevated hover:bg-utaOrange/20 text-muted hover:text-fg hover:scale-105'
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
                    <span className="text-sm text-red-400 font-medium">Recording...</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
                  >
                    Stop
                  </button>
                </div>
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
                id="admin-image-upload"
                className="hidden"
              />
              <label
                htmlFor="admin-image-upload"
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
              className="flex-1 btn-primary py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add to Inventory"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3 rounded-2xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
