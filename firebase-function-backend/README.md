# Firebase Vector Search Backend

Production-ready Firebase Functions v2 backend implementing vector-based matching between user requests and found items using **Firebase Genkit**, **Gemini embeddings**, and **Firestore Vector Search**.

## 🏗️ Architecture

- **Runtime**: Node.js 20+, TypeScript (ES Modules)
- **Platform**: Firebase Functions v2 (Cloud Functions 2nd gen)
- **Database**: Firestore Native Mode with Vector Search
- **Embeddings**: Genkit with Google AI plugin, `text-embedding-004` (768-D)
- **Distance Metric**: COSINE

## 📦 Collections

### `requests` - User-reported lost items
```typescript
{
  id: string,
  userId: string,
  category?: string,
  campus?: string,
  attributes: {
    genericDescription: string,  // Used for embedding
    brand?: string,
    model?: string,
    color?: string,
    ...
  },
  embedding: vector(768),       // Firestore Vector field
  embeddingDim: 768,
  embeddingAt: Timestamp,
  createdAt: Timestamp,
  ...
}
```

### `lost` - Admin-logged found items
```typescript
{
  id: string,
  category?: string,
  campus?: string,
  attributes: {
    genericDescription: string,  // Used for embedding
    brand?: string,
    model?: string,
    color?: string,
    ...
  },
  embedding: vector(768),       // Firestore Vector field
  embeddingDim: 768,
  embeddingAt: Timestamp,
  createdAt: Timestamp,
  ...
}
```

### `requests/{id}/matches` - Match results subcollection
```typescript
{
  lostRef: DocumentReference,  // Reference to lost/{lostId}
  distance: number,             // COSINE distance (0..2)
  confidence: number,           // Confidence score (0..1)
  rank: number,                 // 0-based rank
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd firebase-function-backend
npm install
```

### 2. Configure Environment

Create a `.env` file (see `.env.example`):

```bash
GOOGLE_GENAI_API_KEY=your-gemini-api-key
```

For production, use **Application Default Credentials (ADC)** instead.

### 3. Create Firestore Vector Index

**CRITICAL**: Before deploying, create a vector index on the `lost` collection:

```bash
gcloud firestore indexes composite create \
  --collection-group=lost \
  --field-config field-path=embedding,vector-config='{"dimension":768,"flat": {}}' \
  --database=(default) \
  --project=YOUR_PROJECT_ID
```

This index is **required** for `findNearest()` queries. Without it, you'll get a `VectorIndexMissingError`.

### 4. Build

```bash
npm run build
```

### 5. Deploy

```bash
npm run deploy
```

Or deploy to Firebase:

```bash
firebase deploy --only functions
```

## 📖 Usage

### HTTP Endpoint: `matchRequestHttp`

**Endpoint**: `POST https://<region>-<project>.cloudfunctions.net/matchRequestHttp`

**Request Body**:
```json
{
  "requestId": "REQ123",
  "limit": 5,
  "distanceThreshold": 0.6,
  "prefilters": {
    "category": "electronics",
    "campus": "UTA"
  }
}
```

**Response**:
```json
{
  "ok": true,
  "requestId": "REQ123",
  "matches": [
    {
      "lostId": "LOST456",
      "distance": 0.32,
      "confidence": 0.84,
      "rank": 0
    },
    {
      "lostId": "LOST789",
      "distance": 0.45,
      "confidence": 0.775,
      "rank": 1
    }
  ],
  "duration": 1234
}
```

**Example cURL**:
```bash
curl -X POST https://us-central1-myproject.cloudfunctions.net/matchRequestHttp \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ123",
    "limit": 5,
    "distanceThreshold": 0.6,
    "prefilters": {
      "category": "bag"
    }
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `requestId` | string | *required* | ID of the request document to match |
| `limit` | number | 10 | Max number of matches to return (1-100) |
| `distanceThreshold` | number | 0.6 | Max COSINE distance (0-2) |
| `prefilters.category` | string | - | Filter by category field |
| `prefilters.campus` | string | - | Filter by campus field |

### Error Responses

| Status | Error Type | Description |
|--------|------------|-------------|
| 404 | `RequestNotFoundError` | Request ID not found |
| 400 | `MissingDescriptionError` | Missing `attributes.genericDescription` |
| 500 | `EmbeddingDimensionMismatchError` | Embedding dimension mismatch |
| 503 | `VectorIndexMissingError` | Firestore vector index not created |

## 🔄 Backfill Embeddings

Use the backfill script to generate embeddings for existing documents:

```bash
# Backfill all collections
npm run build && node dist/scripts/backfill-embeddings.js

# Dry run (no writes)
npm run build && node dist/scripts/backfill-embeddings.js --dry-run

# Backfill specific collection
npm run build && node dist/scripts/backfill-embeddings.js --collection=lost

# Limit to 50 documents
npm run build && node dist/scripts/backfill-embeddings.js --limit=50

# Control concurrency (default: 5)
npm run build && node dist/scripts/backfill-embeddings.js --concurrency=10
```

The script:
- ✅ Skips documents that already have embeddings
- ✅ Processes documents in parallel (configurable concurrency)
- ✅ Logs progress and errors
- ✅ Supports dry-run mode

## 🧪 Testing

Run unit tests:

```bash
npm test
```

Tests include:
- Distance → Confidence conversion
- Match sorting by rank
- Edge cases (distance > 2, negative distances)

## 🏗️ Project Structure

```
firebase-function-backend/
├── src/
│   ├── ai.ts              # Genkit + Gemini embedding helper
│   ├── db.ts              # Firebase Admin + vector utilities
│   ├── types.ts           # TypeScript interfaces & errors
│   ├── indexers.ts        # Embedding generation & storage
│   ├── matchRequest.ts    # Core matching logic
│   └── __tests__/         # Unit tests
├── functions/
│   └── src/
│       ├── index.ts       # Firebase Functions entry point
│       └── http.ts        # HTTP endpoint handler
├── scripts/
│   └── backfill-embeddings.ts  # CLI backfill script
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🔐 Security

### Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Service accounts can write embeddings
match /requests/{requestId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow write: if request.auth != null && request.auth.uid == resource.data.userId;

  // Only service accounts can write embedding fields
  allow update: if request.auth.token.firebase.sign_in_provider == 'service_account'
                && request.resource.data.keys().hasAny(['embedding', 'embeddingDim', 'embeddingAt']);

  // Users can read their own matches
  match /matches/{lostId} {
    allow read: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/requests/$(requestId)).data.userId;

    // Users can update match status
    allow update: if request.auth != null
                  && request.auth.uid == get(/databases/$(database)/documents/requests/$(requestId)).data.userId
                  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt']);
  }
}

match /lost/{lostId} {
  // Public read, admin write
  allow read: if true;
  allow write: if request.auth.token.admin == true;

  // Only service accounts can write embedding fields
  allow update: if request.auth.token.firebase.sign_in_provider == 'service_account'
                && request.resource.data.keys().hasAny(['embedding', 'embeddingDim', 'embeddingAt']);
}
```

### Authentication

- **Local Development**: Use ADC (`gcloud auth application-default login`)
- **Production**: Functions automatically use service account credentials
- **API Key**: Store `GOOGLE_GENAI_API_KEY` in Secret Manager (not `.env`)

## 📊 Monitoring

### Structured Logging

All functions use structured logging:
- `console.info()` - Normal operations
- `console.warn()` - Warnings (missing descriptions, skipped docs)
- `console.error()` - Errors (API failures, index issues)

### Cloud Monitoring

View logs:
```bash
npm run logs
# or
firebase functions:log
```

## 🎯 Confidence Scoring

COSINE distance is converted to confidence using:

```typescript
confidence = max(0, 1 - distance / 2)
```

| Distance | Confidence | Interpretation |
|----------|-----------|----------------|
| 0.0 | 1.0 | Perfect match |
| 0.5 | 0.75 | Very good match |
| 1.0 | 0.5 | Moderate match |
| 1.5 | 0.25 | Weak match |
| 2.0 | 0.0 | No match |

## 🚨 Common Issues

### `VectorIndexMissingError`

**Cause**: Firestore vector index not created.

**Solution**: Run the `gcloud firestore indexes` command (see Setup step 3).

### `MissingDescriptionError`

**Cause**: Document missing `attributes.genericDescription`.

**Solution**: Ensure all documents have a non-empty `genericDescription` field.

### `EmbeddingDimensionMismatchError`

**Cause**: Existing embedding has wrong dimension (not 768).

**Solution**: Re-run backfill script to regenerate embeddings.

## 📚 API Reference

### Core Functions

#### `embedGenericDescription(text: string): Promise<number[]>`
Generates a 768-D embedding using Gemini `text-embedding-004`.

#### `ensureEmbedding(ref: DocumentReference, data: any): Promise<number[]>`
Ensures document has a valid embedding, generating if needed (idempotent).

#### `matchRequest(requestId: string, options?: MatchRequestOptions): Promise<MatchRequestResult>`
Matches a request against found items using vector search.

#### `distanceToConfidence(distance: number): number`
Converts COSINE distance (0..2) to confidence (0..1).

See JSDoc comments in source files for detailed documentation.

## 🤝 Contributing

1. Add new features to `src/`
2. Update types in `src/types.ts`
3. Add tests in `src/__tests__/`
4. Update this README

## 📄 License

MIT
