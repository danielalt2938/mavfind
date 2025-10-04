# Quick Setup Guide

This guide will help you get MavFind up and running quickly.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Then edit `.env` with your credentials.

### 3. Get API Keys

#### Firebase
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Firestore and Storage
4. Download service account JSON from Project Settings → Service Accounts

#### Google OAuth
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

#### Google Gemini AI
1. Go to https://makersuite.google.com/app/apikey
2. Create API key

#### OpenAI (Whisper)
1. Go to https://platform.openai.com/api-keys
2. Create API key

#### Algolia
1. Go to https://www.algolia.com
2. Create application
3. Get App ID and API keys

#### SendGrid
1. Go to https://sendgrid.com
2. Create API key

### 4. Initialize Firestore Data

Create the location document in Firestore:

**Collection**: `info`
**Document ID**: `location`
**Data**:
```json
{
  "locations": [
    {
      "id": "loc1",
      "name": "Main Campus",
      "address": "123 Main St",
      "geo": { "lat": 32.1, "lng": -97.1 },
      "isActive": true
    },
    {
      "id": "loc2",
      "name": "North Office",
      "address": "456 North Ave",
      "geo": { "lat": 32.3, "lng": -97.2 },
      "isActive": true
    }
  ]
}
```

### 5. Deploy Firestore Rules

Option A - Using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Option B - Manual:
Copy content from `firestore.rules` to Firebase Console → Firestore → Rules

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 7. Create Admin User

1. Sign in with Google
2. Go to Firebase Console → Firestore → users collection
3. Find your user document (by UID from authentication)
4. Change `role` from `"user"` to `"admin"`
5. Reload the app

## Environment Variables Checklist

Make sure your `.env` file has all of these:

- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_PRIVATE_KEY
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] FIREBASE_STORAGE_BUCKET
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET (generate with: `openssl rand -base64 32`)
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GEMINI_API_KEY
- [ ] OPENAI_API_KEY
- [ ] NEXT_PUBLIC_ALGOLIA_APP_ID
- [ ] NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
- [ ] ALGOLIA_ADMIN_API_KEY
- [ ] ALGOLIA_INDEX_NAME
- [ ] SENDGRID_API_KEY
- [ ] SENDGRID_FROM_EMAIL
- [ ] NEXT_PUBLIC_APP_URL
- [ ] CRON_SECRET (for production)

## Testing the App

### As a User
1. Go to http://localhost:3000
2. Click "Sign In"
3. Sign in with Google
4. Click "Report Lost Item"
5. Fill out the form and submit
6. View your report in "My Reports"

### As an Admin
1. Sign in with Google
2. Update your role to "admin" in Firestore
3. Go to http://localhost:3000/dashboard/admin
4. Click "Add Found Item"
5. Fill out the form and submit

### Search Inventory
1. Go to http://localhost:3000/inventory
2. Search for items

## Troubleshooting

### "Error: Could not load the default credentials"
- Check your Firebase service account credentials
- Ensure FIREBASE_PRIVATE_KEY has proper line breaks

### "NextAuth configuration error"
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your current URL

### Items not appearing in search
- Verify Algolia credentials
- Check that items are being indexed (look at Algolia dashboard)

### Emails not sending
- Check SendGrid API key
- Verify SENDGRID_FROM_EMAIL is a verified sender

## Production Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add all environment variables in Vercel dashboard

4. Update Google OAuth redirect URIs to include your production domain

5. Update NEXTAUTH_URL to your production URL

## Next Steps

- Customize locations in Firestore
- Adjust email templates in `lib/email/sendgrid.ts`
- Customize UI colors and branding
- Add more item categories
- Implement advanced matching algorithms

## Support

If you encounter any issues, check:
1. Environment variables are all set correctly
2. Firebase project is properly configured
3. All API keys are valid
4. Firestore security rules are deployed

For bugs and feature requests, open an issue on GitHub.
