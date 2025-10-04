import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MavFind</h1>
          <nav className="space-x-4">
            <Link href="/inventory" className="hover:underline">
              Search Inventory
            </Link>
            <Link href="/dashboard/user" className="hover:underline">
              My Reports
            </Link>
            <Link href="/auth/signin" className="hover:underline">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Lost Something? We're Here to Help.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            MavFind connects you with lost and found items across all office
            locations. Report a lost item or search our inventory to find what
            you're looking for.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {/* Report Lost Item */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-3">Report Lost Item</h3>
              <p className="text-gray-600 mb-6">
                Lost something? Let us know and we'll help you track it down.
              </p>
              <Link
                href="/dashboard/user"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Report Now
              </Link>
            </div>

            {/* Search Inventory */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold mb-3">Search Inventory</h3>
              <p className="text-gray-600 mb-6">
                Browse found items across all locations to see if we have your
                item.
              </p>
              <Link
                href="/inventory"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                Search Now
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">🤖 AI-Powered</h4>
              <p className="text-gray-600 text-sm">
                Our AI automatically categorizes items and extracts details from
                descriptions.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">📍 Multi-Location</h4>
              <p className="text-gray-600 text-sm">
                Track items across all office locations in one central platform.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">📧 Notifications</h4>
              <p className="text-gray-600 text-sm">
                Get notified when items matching your preferences are found.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 MavFind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
