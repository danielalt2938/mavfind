# 🏗️ MavFind Infrastructure Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
│                    Next.js 15 + React 19 + TypeScript                │
│                  Hosted on Vercel (Edge Network)                     │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
                    ┌─────────────────────────────┐
                    │   Firebase Authentication   │
                    │      (Google OAuth)         │
                    └─────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS API ROUTES                           │
│                    (Serverless Edge Functions)                      │
│                                                                     │
│  Handles all backend logic: auth, CRUD, AI processing, search      │
└─────────────────────────────────────────────────────────────────────┘
              ↓                    ↓                    ↓
    ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
    │   Google AI     │  │   Firestore DB   │  │  Algolia Search │
    │   (Gemini)      │  │   (NoSQL + Vec)  │  │  (Instant Search)│
    └─────────────────┘  └──────────────────┘  └─────────────────┘
                                  ↓
                    ┌─────────────────────────────┐
                    │  Firebase Cloud Functions   │
                    │   (Background Triggers)     │
                    └─────────────────────────────┘
```

---

## 🌐 Frontend Layer

### **Vercel (Hosting)**
```
Platform: Edge Network (Global CDN)
Framework: Next.js 15 (App Router)
Language: TypeScript + React 19
Styling: Tailwind CSS
Animations: Framer Motion

What it does:
- Serves static pages (landing, auth, dashboards)
- Runs serverless API routes at the edge
- Handles image optimization
- Auto-scales with traffic
```

### **Key Technologies**
| Tool | Purpose | Where Used |
|------|---------|------------|
| **Next.js 15** | Full-stack framework | All pages & API routes |
| **TypeScript** | Type safety | Entire codebase |
| **Tailwind CSS** | Styling | UI components |
| **Framer Motion** | Animations | Card transitions, modals |
| **react-instantsearch** | Search UI | Admin inventory search |

---

## 🔐 Authentication Layer

### **Firebase Auth**
```
Provider: Google OAuth (Sign in with Google)
Where: lib/firebase/config.ts (client) + admin.ts (server)

Flow:
1. User clicks "Sign in with Google"
2. Firebase Auth redirects to Google
3. Google returns ID token
4. Token stored in browser (localStorage)
5. Every API call includes: Authorization: Bearer <token>
6. Server verifies token with Firebase Admin SDK
```

**Role Management:**
- Stored in Firestore `users/{uid}` collection
- Roles: `"user"` or `"admin"`
- Checked server-side on every admin action

---

## 🗄️ Database Layer

### **Firestore (Primary Database)**
```
Provider: Google Cloud Firestore
Plan: Blaze (Pay-as-you-go) - Required for Vector Search

Collections:
┌─────────────────────────────────────────────────────────────┐
│  users/                                                     │
│    ├── {uid}/                                               │
│    │   ├── role: "user" | "admin"                          │
│    │   ├── email: string                                   │
│    │   └── createdAt: timestamp                            │
│                                                             │
│  requests/  (User-submitted lost item reports)             │
│    ├── {requestId}/                                         │
│    │   ├── title: string                                   │
│    │   ├── description: string                             │
│    │   ├── genericDescription: string                      │
│    │   ├── embedding: Vector(768)  ← AI-generated         │
│    │   ├── embeddingDim: 768                               │
│    │   ├── attributes: { brand, color, model, ... }        │
│    │   ├── images: string[]                                │
│    │   ├── category: string                                │
│    │   ├── locationId: string                              │
│    │   ├── ownerUid: string                                │
│    │   ├── status: "submitted" | "approved" | "matched"    │
│    │   └── matches/  (Subcollection)                       │
│    │       ├── {lostId}/                                    │
│    │       │   ├── lostRef: DocumentRef                    │
│    │       │   ├── distance: number (0-2)                  │
│    │       │   ├── confidence: number (0-1)                │
│    │       │   ├── rank: number                            │
│    │       │   └── status: "pending"                       │
│                                                             │
│  lost/  (Admin-registered found items)                     │
│    ├── {lostId}/                                            │
│    │   ├── title: string                                   │
│    │   ├── description: string                             │
│    │   ├── genericDescription: string                      │
│    │   ├── embedding: Vector(768)  ← AI-generated         │
│    │   ├── embeddingDim: 768                               │
│    │   ├── attributes: { brand, color, model, ... }        │
│    │   ├── images: string[]                                │
│    │   ├── category: string                                │
│    │   ├── locationId: string                              │
│    │   ├── handlerUid: string (admin who added it)         │
│    │   └── status: "found" | "claimed" | "archived"        │
│                                                             │
│  locations/                                                 │
│    ├── university-center/                                   │
│    │   ├── name: "University Center"                       │
│    │   ├── address: "..."                                  │
│    │   └── hours: "..."                                    │
│    └── central-library/                                     │
└─────────────────────────────────────────────────────────────┘

Vector Index (REQUIRED for matching):
  Collection: lost
  Field: embedding
  Dimensions: 768
  Algorithm: COSINE distance
  Created via: gcloud CLI command
```

### **Firebase Storage**
```
Purpose: Image uploads (JPG, PNG, HEIC)
Buckets:
  ├── requests/{requestId}/{imageId}.jpg
  └── lost/{lostId}/{imageId}.jpg

Features:
- Auto-conversion from HEIC → JPEG
- Max 5 images per item
- CDN-backed URLs
- Access controlled via Firebase rules
```

---

## 🤖 AI Layer

### **1. Google Gemini (Vision & Text Analysis)**
```
Model: gemini-1.5-flash
API: @google/generative-ai
Where: lib/ai/gemini.ts

What it does:
1. Analyzes images → extracts attributes (brand, color, model, etc.)
2. Analyzes text descriptions → extracts attributes
3. Generates "genericDescription" for embedding

Example Flow:
  Input: "Lost my black iPhone 13 Pro" + [image.jpg]
       ↓
  Gemini analyzes both
       ↓
  Output: {
    category: "electronics",
    subcategory: "smartphone",
    brand: "Apple",
    model: "iPhone 13 Pro",
    color: "black",
    genericDescription: "Black Apple iPhone 13 Pro smartphone"
  }

Cost: ~$0.001 per request
Used: Every time item is created (not on search!)
```

### **2. Google Vertex AI (Embeddings)**
```
Model: text-embedding-004
Dimensions: 768
Where: firebase-function-backend/src/ai.ts

What it does:
  Converts text → 768-number vector representing semantic meaning

Example:
  "Black iPhone 13 Pro" → [0.234, -0.891, 0.456, ..., 0.123]

Cost: ~$0.0001 per embedding
Used: Once per item when created
Cached: Stored in Firestore forever
```

### **3. ElevenLabs (Speech-to-Text)**
```
Service: ElevenLabs Transcription
Where: /api/transcribe/route.ts
Format: Audio blob → Text

Flow:
  User records voice → Upload to /api/transcribe → Returns text

Used: When users use voice input for descriptions
```

---

## 🔍 Search Layer

### **Algolia (Keyword Search)**
```
Purpose: Fast text search for admin dashboard
Indexes:
  - mavfind_requests (user reports)
  - mavfind_lost_items (found inventory)

Features:
  ✓ Instant search (< 10ms)
  ✓ Typo tolerance
  ✓ Faceted filtering (category, location)
  ✓ Highlighting
  ✓ Pagination

Where Used:
  - Admin Dashboard (dual search tabs)
  - Inventory page

How it syncs:
  Manual indexing (not auto-synced with Firestore)
  Admin creates item → Saved to Firestore → Manually indexed to Algolia

Cost: Free tier up to 10k searches/month
```

### **Firestore Vector Search (Semantic Matching)**
```
Purpose: AI-powered "find similar items" matching
Algorithm: k-Nearest Neighbors (kNN) with COSINE distance
Index: Pre-built spatial index on embedding field

Flow:
  User creates request
       ↓
  Generate embedding [0.23, -0.89, ...]
       ↓
  query.findNearest('embedding', requestVector, {
    limit: 10,
    distanceMeasure: 'COSINE'
  })
       ↓
  Returns top 10 similar items in ~100ms

Performance:
  - 100 items: ~50ms
  - 1 million items: ~150ms (logarithmic scaling!)
  - Distributed across Google's infrastructure

Cost: Included in Firestore reads (1 read per result)
```

---

## ⚡ Backend Functions Layer

### **Firebase Cloud Functions**
```
Location: firebase-function-backend/src/
Runtime: Node.js (deployed to Google Cloud)
Trigger: Firestore events

Functions:
┌────────────────────────────────────────────────────────────┐
│  onRequestCreated (triggers.ts)                            │
│    Trigger: New document in requests/                     │
│    Action:                                                 │
│      1. Ensure request has embedding                      │
│      2. Run matchRequest() to find top 3 matches          │
│      3. Save matches to requests/{id}/matches/            │
│      4. Send email notification (optional)                │
│                                                            │
│  onLostItemCreated (triggers.ts)                           │
│    Trigger: New document in lost/                         │
│    Action:                                                 │
│      1. Ensure lost item has embedding                    │
│      2. Fetch ALL requests (up to 1000 limit)             │
│      3. Re-match each request against new item            │
│      4. Update all match subcollections                   │
│                                                            │
│  matchRequest() (matchRequest.ts)                          │
│    Called by: Triggers (auto) or API routes (manual)      │
│    Does:                                                   │
│      1. Load request, ensure embedding exists             │
│      2. Build Firestore query with filters                │
│      3. Execute vector search (findNearest)               │
│      4. Convert distances → confidence scores             │
│      5. Filter by threshold (distance ≤ 0.6)              │
│      6. Delete old matches, save new ones                 │
│      7. Return top matches                                │
└────────────────────────────────────────────────────────────┘

Configuration:
  Memory: 512MB per function
  Timeout: 540 seconds (9 minutes)
  Max Instances: 10 concurrent
  Region: us-central1 (default)
```

---

## 🔄 Data Flow Examples

### **Creating a Lost Item Report (User)**
```
1. User fills form on /dashboard/user
      ↓
2. Optional: Records voice → /api/transcribe (ElevenLabs)
      ↓
3. Uploads images to Firebase Storage
      ↓
4. Submits to Next.js API route
      ↓
5. API calls Gemini to extract attributes from text + images
      ↓
6. Saves to Firestore requests/ collection (NO embedding yet)
      ↓
7. Firestore trigger: onRequestCreated fires
      ↓
8. Cloud function generates embedding via Vertex AI
      ↓
9. Cloud function runs vector search against lost/ collection
      ↓
10. Saves top 3 matches to requests/{id}/matches/
      ↓
11. User refreshes → Sees matches on dashboard
```

### **Admin Adding Found Item**
```
1. Admin fills form on /dashboard/admin
      ↓
2. Uploads required images to Firebase Storage
      ↓
3. Submits to Next.js API route
      ↓
4. API calls Gemini to extract attributes
      ↓
5. Saves to Firestore lost/ collection
      ↓
6. Firestore trigger: onLostItemCreated fires
      ↓
7. Cloud function generates embedding
      ↓
8. Cloud function fetches ALL requests (up to 1000)
      ↓
9. Re-matches each request against new item (batch processing)
      ↓
10. Updates match subcollections for affected requests
      ↓
11. Users with new matches see them on refresh
```

### **Voice Search (Phone Call)**
```
1. User calls ElevenLabs phone number
      ↓
2. ElevenLabs AI: "What did you lose?"
      ↓
3. User: "I lost a black iPhone in the library"
      ↓
4. ElevenLabs sends webhook to /api/voice/search
      ↓
5. API generates embedding from description
      ↓
6. Runs vector search against lost/ collection
      ↓
7. Returns top 3 matches as JSON
      ↓
8. ElevenLabs AI reads results: "I found 3 possible matches..."
      ↓
9. User can request SMS with details
```

---

## 📊 Technology Stack Summary

| Layer | Technology | Purpose | Cost |
|-------|-----------|---------|------|
| **Hosting** | Vercel | Frontend + Edge functions | Free (Hobby) |
| **Framework** | Next.js 15 | Full-stack React | Free |
| **Database** | Firestore | NoSQL + Vector search | Pay per read/write |
| **Storage** | Firebase Storage | Image uploads | Pay per GB |
| **Auth** | Firebase Auth | Google OAuth | Free (< 10k users) |
| **AI Vision** | Gemini 1.5 Flash | Image analysis | ~$0.001/request |
| **Embeddings** | Vertex AI text-embedding | 768-dim vectors | ~$0.0001/embedding |
| **Voice** | ElevenLabs | Speech-to-text | Pay per usage |
| **Search** | Algolia | Keyword search | Free (< 10k searches) |
| **Functions** | Cloud Functions | Background triggers | Pay per invocation |
| **Phone AI** | ElevenLabs (optional) | Voice agent | Pay per minute |

---

## 🌍 Deployment Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     PRODUCTION SETUP                          │
└───────────────────────────────────────────────────────────────┘

Frontend (Vercel):
  Domain: mavfind.vercel.app
  Deploy: git push → Auto-deploy
  Regions: Edge (Global CDN)
  Build: Next.js SSR + Static
  Env: .env.local → Vercel Env Vars

Backend (Firebase):
  Project: mavfind-xyz (example)
  Region: us-central1
  Database: Firestore (Blaze plan)
  Functions: Deployed via firebase-function-backend/
  Storage: Default bucket

External APIs:
  ├── Gemini API (cloud.google.com)
  ├── Vertex AI (cloud.google.com)
  ├── OpenAI Whisper (platform.openai.com)
  └── Algolia (algolia.com)
```

---

## 🔒 Security Architecture

```
Authentication:
  ✓ Firebase Auth tokens (JWT)
  ✓ Server-side verification on every API call
  ✓ Role-based access (user vs admin)

Authorization:
  ✓ Users can only delete their own requests
  ✓ Admins can access all data
  ✓ All writes go through API routes (never client-direct)

Data Protection:
  ✓ Firestore rules prevent direct client writes
  ✓ API routes validate user ownership
  ✓ Images stored in protected Firebase Storage
  ✓ No sensitive data in client code

API Security:
  ✓ All routes check Authorization: Bearer <token>
  ✓ Admin routes verify role === "admin"
  ✓ Rate limiting via Vercel/Firebase
```

---

## 📈 Scalability Notes

| Component | Current | Max Scale | Bottleneck |
|-----------|---------|-----------|------------|
| **Firestore** | < 1k items | Millions | None (distributed) |
| **Vector Search** | ~100ms | ~200ms at 1M items | Logarithmic |
| **Cloud Functions** | 10 instances | 1000s (auto-scales) | Concurrent limit |
| **Vercel** | Edge functions | Unlimited | None |
| **Algolia** | Free tier | 10k searches/mo | Quota |
| **Firebase Auth** | < 100 users | Millions | None |

**Performance Targets:**
- Page load: < 2s
- Search: < 100ms
- AI matching: < 5s
- Image upload: < 10s

---

## 🛠️ Local Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in:
# - Firebase credentials (client + admin)
# - Gemini API key
# - OpenAI API key
# - Algolia keys

# Run dev server
npm run dev
# → localhost:3000

# Deploy Firebase functions
cd firebase-function-backend
npm install
npm run deploy
```

---

## 🔗 Key Files

```
Infrastructure Configuration:
├── vercel.json                    # Vercel deployment config
├── firebase.json                  # Firebase project config
├── .env.local                     # Environment variables
├── lib/firebase/config.ts         # Firebase client init
├── lib/firebase/admin.ts          # Firebase Admin SDK
├── lib/ai/gemini.ts               # Gemini API client
├── lib/search/algolia.ts          # Algolia client
└── firebase-function-backend/
    ├── src/index.ts               # Cloud Functions entry
    ├── src/triggers.ts            # Firestore triggers
    ├── src/matchRequest.ts        # Vector search logic
    └── src/ai.ts                  # Vertex AI embeddings
```

---

**Built with modern cloud infrastructure for instant matching at scale** 🚀
