# Deployment Guide

## ✅ What's Ready

All code has been written and compiled successfully:

- ✅ Embedding generation with Google AI `text-embedding-004`
- ✅ Vector search with Firestore COSINE distance
- ✅ HTTP endpoint `matchRequestHttp`
- ✅ Backfill script for existing data
- ✅ Unit tests
- ✅ TypeScript compilation successful

## 🚨 Required: Enable Billing

Your deployment failed because Cloud Functions requires an active billing account.

### Steps to Enable Billing:

1. **Go to Billing Console:**
   ```
   https://console.cloud.google.com/billing/linkedaccount?project=mavfind-5780c
   ```

2. **Link a billing account** to your project

3. **Set up App Engine** (required for Cloud Functions):
   ```
   https://console.cloud.google.com/appengine?project=mavfind-5780c
   ```
   - Click "Create Application"
   - Select region: `us-central1` (or your preferred region)

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Billing is enabled for project `mavfind-5780c`
- [ ] App Engine application is created
- [ ] APIs are enabled (deployment will enable these automatically):
  - Cloud Functions API
  - Cloud Build API
  - Cloud Run API
  - Eventarc API
  - Pub/Sub API
  - Artifact Registry API

## 🚀 Deploy After Billing is Enabled

```bash
cd firebase-function-backend
firebase deploy --only functions
```

Expected output:
```
✔  functions: Finished running predeploy script.
✔  functions[matchRequestHttp(us-central1)] Successful create operation.
✔  Deploy complete!

Function URL (matchRequestHttp): https://us-central1-mavfind-5780c.cloudfunctions.net/matchRequestHttp
```

## 🔐 Set API Key as Secret (Production)

For production, store the API key in Secret Manager instead of `.env`:

```bash
# Create secret
firebase functions:secrets:set GOOGLE_GENAI_API_KEY

# Update function to use secret (already configured in code)
firebase deploy --only functions
```

## 📊 Create Vector Index

**CRITICAL**: After first deployment, create the Firestore vector index:

```bash
gcloud firestore indexes composite create \
  --collection-group=lost \
  --field-config field-path=embedding,vector-config='{"dimension":768,"flat": {}}' \
  --database=(default) \
  --project=mavfind-5780c
```

This takes 10-15 minutes to build. Check status:

```bash
gcloud firestore indexes composite list --project=mavfind-5780c
```

## 🧪 Test the Function

Once deployed and index is ready:

```bash
curl -X POST https://us-central1-mavfind-5780c.cloudfunctions.net/matchRequestHttp \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "TEST_REQUEST_ID",
    "limit": 5,
    "distanceThreshold": 0.6
  }'
```

## 🔄 Run Backfill Script

After deployment, backfill embeddings for existing documents:

```bash
# From your local machine (requires Firebase Admin SDK credentials)
npm run build

# Dry run first
node lib/scripts/backfill-embeddings.js --dry-run

# Run for real
node lib/scripts/backfill-embeddings.js
```

## 📝 Deployment Notes

### Current Status:
- ✅ Code compiled successfully
- ✅ All TypeScript errors resolved
- ✅ Project structure correct
- ❌ **Billing not enabled** (blocking deployment)

### What Happens on Deployment:
1. TypeScript compiles `src/` → `lib/`
2. Cloud Build packages your code
3. Creates Cloud Function in `us-central1`
4. Exposes HTTP endpoint
5. Environment variables loaded from `.env`

### Cost Estimates (after billing enabled):

**Cloud Functions:**
- First 2M invocations/month: FREE
- $0.40 per million invocations after

**Firestore:**
- First 50K reads/day: FREE
- Vector search counts as 1 read per document

**Gemini API:**
- text-embedding-004: $0.000025 per 1K characters
- Very affordable for typical usage

## 🆘 Troubleshooting

### Issue: "Please check billing account"
**Solution:** Enable billing at the URL above

### Issue: "App Engine instance not found"
**Solution:** Create App Engine app in console

### Issue: "Vector index not found"
**Solution:** Run the gcloud command to create index

### Issue: "GOOGLE_GENAI_API_KEY not found"
**Solution:** Ensure `.env` file exists with your API key

## 📞 Support

If issues persist after enabling billing:
- Check Firebase Console: https://console.firebase.google.com/project/mavfind-5780c
- View logs: `firebase functions:log`
- Check status: `firebase functions:list`
