<div align="center">
  <img src="https://media.discordapp.net/attachments/1424096725186121820/1424412525201461278/MAV.png?ex=68e3db0a&is=68e2898a&hm=753c3c19cd325564aeda0aca622b61c49370feed480f15830963002b7981afc9&=&format=webp&quality=lossless&width=1000&height=1000" alt="MavFind Logo" width="120" height="120">

# MavFind - AI-Powered Lost & Found Platform

A comprehensive lost and found platform for UTA campus with AI-powered matching, voice input, vector search, and multi-location support. Built with Next.js 15, Firebase, Google Gemini AI, and Firestore Vector Search.

</div>

## ✨ Key Features

### 🎯 AI-Powered Smart Matching

- **Vector Embeddings** - Uses Firestore Vector Search with COSINE similarity to find matching items
- **Automatic Categorization** - Google Gemini AI extracts attributes (brand, color, model, etc.) from descriptions and images
- **Confidence Scoring** - Shows match confidence percentage (90-96% for top matches)
- **Multi-Source Analysis** - Analyzes both text descriptions AND images for better accuracy
- **HEIC/HEIF Support** - Automatically converts Apple photos to JPEG for processing

### 👤 For Users

- 📝 **Report Lost Items** - Submit detailed reports with text or voice descriptions
- 🎤 **Voice Input** - OpenAI Whisper transcribes voice recordings to text
- 📸 **Image Upload** - Upload multiple photos (JPG, PNG, HEIC, HEIF)
- 🔍 **View Matches** - See AI-matched found items with confidence scores
- 📍 **Pickup Locations** - Clear directions on where to claim matched items
- 🗑️ **Delete Requests** - Users can delete their own requests
- 🚨 **Sensitive Item Warnings** - Alerts for credit cards, wallets, phones to contact UTA Police
- 🏷️ **Category Badges** - Visual organization by item type

### 👨‍💼 For Admins

- ➕ **Add Found Items** - Register items with required images and descriptions
- 🔎 **Dual Search Tabs** - Separate Algolia search for Requests and Lost Inventory
- ✅ **Approve/Reject Requests** - Review and moderate user submissions
- 🗑️ **Delete Items** - Remove both lost items and user requests
- 🎙️ **Voice Descriptions** - Record item descriptions with built-in voice recorder
- 🏢 **Multi-Location Support** - Manage items at University Center and Central Library
- 📊 **Real-time Dashboard** - View all items and requests in card grid layout
- 🔒 **Admin-Only Inventory** - Public inventory page restricted to administrators

### 🤖 Advanced AI Features

- **Google Gemini Vision** - Analyzes images to extract item attributes
- **Text Embeddings** - Vertex AI text-embedding-005 for semantic search
- **Generic Descriptions** - AI generates searchable descriptions for better matching
- **Fallback Handling** - Graceful degradation if AI services fail
- **Multimodal Input** - Combines text + images for maximum accuracy

### 🔊 Voice AI Integration (Ready for ElevenLabs)

- **Voice Search API** - `/api/voice/search` endpoint for conversational AI
- **Phone Call Support** - Users can call to describe lost items
- **Real-time Matching** - Voice → Text → Vector Search → Spoken Results
- **Location Formatting** - Speaks pickup locations naturally
- **Multi-language Ready** - Supports future language expansion

### 🔍 Search & Discovery

- **Algolia InstantSearch** - Lightning-fast search with typo tolerance
- **Vector Search** - Semantic similarity matching via Firestore
- **Dual Index System** - Separate indexes for requests and inventory
- **Category Filtering** - Browse by electronics, bags, cards, etc.
- **Time-based Sorting** - Most recent items first
- **Image Previews** - See items before viewing details

### 🎨 User Experience

- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Dark Theme** - UTA-branded color scheme (Orange & Blue)
- **Framer Motion** - Smooth animations and transitions
- **Card Layouts** - 5 cards per row on desktop, responsive grid
- **Loading States** - Skeleton screens and spinners
- **Modal Details** - Full-screen item details with image galleries
- **Status Badges** - Visual indicators for request status

### 🔐 Security & Privacy

- **Firebase Authentication** - Google Sign-In only
- **Role-Based Access** - User and Admin roles
- **Server-Side Validation** - All writes through secure API routes
- **Ownership Checks** - Users can only delete their own items
- **Admin Verification** - Token-based admin authorization
- **Sensitive Item Protection** - Warns users about credit cards/wallets/phones

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Search**: Algolia InstantSearch React
- **Image Processing**: heic-convert, heic2any

### Backend

- **Runtime**: Next.js API Routes
- **Database**: Firebase Firestore (with Vector Search)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth (Google OAuth)
- **Functions**: Firebase Cloud Functions (matching system)

### AI & ML

- **Vision AI**: Google Gemini Vision (gemini-1.5-flash)
- **Embeddings**: Vertex AI text-embedding-005
- **Speech-to-Text**: OpenAI Whisper
- **Vector Search**: Firestore Native Vector Search (COSINE)

### Infrastructure

- **Hosting**: Vercel
- **Search**: Algolia
- **Voice AI Ready**: ElevenLabs Conversational AI

## 📁 Project Structure

```
mavfind/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── lost/[id]/route.ts      # Delete lost items
│   │   │   ├── lost/route.ts           # Add found items
│   │   │   ├── lost/status/route.ts    # Update item status
│   │   │   └── requests/
│   │   │       ├── [id]/route.ts       # Delete requests
│   │   │       ├── approve/route.ts    # Approve requests
│   │   │       └── reject/route.ts     # Reject requests
│   │   ├── auth/
│   │   │   └── user-role/route.ts      # Get user role
│   │   ├── inventory/route.ts          # Search inventory (Algolia)
│   │   ├── requests/
│   │   │   ├── [id]/
│   │   │   │   ├── delete/route.ts     # User delete request
│   │   │   │   └── matches/route.ts    # Get AI matches
│   │   │   ├── mine/route.ts           # User's requests
│   │   │   └── route.ts                # Create request
│   │   ├── transcribe/route.ts         # Whisper STT
│   │   └── voice/
│   │       └── search/route.ts         # Voice AI search
│   ├── auth/signin/page.tsx            # Sign-in page
│   ├── dashboard/
│   │   ├── admin/page.tsx              # Admin dashboard
│   │   └── user/
│   │       ├── page.tsx                # User dashboard
│   │       └── requests/[id]/page.tsx  # Match details
│   ├── inventory/page.tsx              # Public inventory (admin-only)
│   └── page.tsx                        # Landing page
├── components/ui/                      # Reusable UI components
├── lib/
│   ├── ai/
│   │   ├── gemini.ts                   # Gemini vision & text
│   │   └── whisper.ts                  # OpenAI Whisper
│   ├── auth/
│   │   ├── AuthContext.tsx             # Auth provider
│   │   └── server.ts                   # Server auth utils
│   ├── firebase/
│   │   ├── admin.ts                    # Firebase Admin SDK
│   │   ├── config.ts                   # Client config
│   │   ├── firestore.ts                # CRUD operations
│   │   └── storage.ts                  # File uploads
│   └── search/algolia.ts               # Algolia client
├── firebase-function-backend/
│   └── src/
│       ├── ai.ts                       # Vertex AI embeddings
│       ├── indexers.ts                 # Embedding generation
│       ├── matchRequest.ts             # Vector search matching
│       └── triggers.ts                 # Firestore triggers
└── types/index.ts                      # TypeScript types
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- Firebase project with Blaze plan (for Vector Search)
- Google Cloud project (for Gemini & Vertex AI)
- OpenAI API key
- Algolia account
- Vercel account (for deployment)

### 1. Clone Repository

```bash
git clone <your-repo>
cd mavfind
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Services**:
   - Authentication → Google Sign-In
   - Firestore Database (Production mode)
   - Storage
3. **Get Credentials**:
   - Web app config (for client)
   - Service account JSON (for admin)

### 3. Google Cloud Setup

1. **Enable APIs** in Google Cloud Console:
   - Vertex AI API
   - Generative Language API
2. **Get API Key** for Gemini

### 4. Environment Variables

Copy `.env.example` to `.env.local`:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=
FIREBASE_STORAGE_BUCKET=

# AI
GEMINI_API_KEY=
OPENAI_API_KEY=

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=
NEXT_PUBLIC_ALGOLIA_INDEX_NAME_REQUESTS=mavfind_requests
NEXT_PUBLIC_ALGOLIA_INDEX_NAME_INVENTORY=mavfind_lost_items
```

### 5. Firestore Vector Index Setup

Create vector index for embeddings:

```bash
gcloud firestore indexes composite create \
  --collection-group=lost \
  --query-scope=COLLECTION \
  --field-config field-path=embedding,vector-config='{"dimension":"768","flat": "{}"}' \
  --project=your-project-id
```

### 6. Deploy Firebase Functions

```bash
cd firebase-function-backend
npm install
npm run deploy
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Data Models

### Request (Lost Item Report)

```typescript
{
  id: string
  title: string
  description: string
  category: ItemCategory
  subcategory?: string
  genericDescription: string
  attributes: ItemAttributes
  images: string[]
  locationId: string
  ownerUid: string
  status: "submitted" | "approved" | "matched" | "claimed"
  embedding?: number[]  // 768-dim vector
  embeddingDim?: number
  createdAt: string
  updatedAt: string
}
```

### LostItem (Found Item)

```typescript
{
  id: string
  title: string
  description: string
  category: ItemCategory
  subcategory?: string
  genericDescription: string
  attributes: ItemAttributes
  images: string[]
  locationId: string
  handlerUid: string
  status: "found" | "claimed" | "archived"
  embedding?: number[]  // 768-dim vector
  embeddingDim?: number
  createdAt: string
  updatedAt: string
}
```

### Match

```typescript
{
  lostId: string;
  distance: number; // COSINE distance (0-2)
  confidence: number; // Percentage (0-100)
  rank: number;
  status: string;
  createdAt: string;
}
```

## 🔄 AI Matching Pipeline

1. **User submits request** with description/images
2. **Gemini extracts attributes** from text + images
3. **Generate embedding** from genericDescription (768-dim)
4. **Store in Firestore** with embedding field
5. **Firebase trigger** runs matching against all lost items
6. **Vector search** finds top 3 similar items (COSINE < 0.6)
7. **Save matches** to subcollection with confidence scores
8. **User views matches** sorted by confidence

## 🎙️ Voice AI Setup (Optional)

### ElevenLabs Integration

1. Create agent at [elevenlabs.io](https://elevenlabs.io)
2. Configure webhook: `https://yourdomain.com/api/voice/search`
3. System prompt:

```
You are MavFind assistant. Ask what they lost.
When they describe it, call the webhook.
Read results back clearly with location and confidence.
Offer to send details via SMS.
```

## 🛡️ Security Rules

Firestore rules ensure:

- Users can only read/delete their own requests
- Admins can access all data
- All writes through server APIs
- No client-side mutations

## 📱 User Roles

### Creating Admins

1. User signs in with Google
2. Go to Firestore → `users` collection
3. Find user by UID
4. Change `role: "user"` to `role: "admin"`

## 🚀 Deployment

### Vercel Deployment

```bash
vercel
```

Add all environment variables in Vercel dashboard.

### Firebase Functions

```bash
cd firebase-function-backend
npm run deploy
```

## 🐛 Troubleshooting

### Common Issues

**Vector Search Not Working**

- Check Firestore vector index is created
- Verify embeddings are 768 dimensions
- Ensure Firebase Blaze plan is active

**AI Extraction Fails**

- Verify Gemini API key is valid
- Check image format (HEIC conversion working?)
- Review console logs for errors

**Matches Always 93%**

- This means `distanceResultField` isn't working
- Synthetic distances are being used as fallback
- Update Firebase SDK or adjust formula

**Voice Search Errors**

- Check `/api/voice/search` endpoint
- Verify Vertex AI credentials
- Test embedding generation

## 📈 Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] QR code item tagging
- [ ] Analytics dashboard
- [ ] Email notifications for matches
- [ ] Batch import for admins

## 📄 License

MIT License - Built for UTA Mavericks

## 🙏 Credits

- **AI**: Google Gemini, OpenAI Whisper, Vertex AI
- **Search**: Algolia
- **Backend**: Firebase
- **Hosting**: Vercel
- **Design**: Tailwind CSS, Framer Motion

---

**For UTA Mavericks, By UTA Mavericks** 🔶🔷
