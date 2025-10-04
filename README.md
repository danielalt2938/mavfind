# MavFind - Lost & Found Web Application

A comprehensive lost and found platform for managing items across multiple office locations. Built with Next.js 15, Firebase, AI-powered categorization, and smart search capabilities.

## Features

### For Users
- 🔍 **Report Lost Items** - Submit detailed reports with descriptions and images
- 🎤 **Speech-to-Text** - Use voice input to describe lost items via OpenAI Whisper
- 📦 **Search Inventory** - Browse all found items using Algolia's smart search
- 📧 **Email Notifications** - Get notified when items matching your preferences are found
- 📊 **Track Status** - Monitor the status of your lost item reports

### For Admins
- ➕ **Add Found Items** - Register items found at your location
- ✅ **Manage Requests** - Approve, reject, or match lost item reports
- 🏢 **Multi-Location** - Choose and manage items for specific office locations
- 📬 **Notifications** - Receive alerts about new lost item reports

### AI-Powered Features
- 🤖 **Auto-Categorization** - Google Gemini AI automatically extracts attributes from descriptions
- 🎯 **Smart Search** - Algolia-powered search across all items
- 🗣️ **Voice Input** - OpenAI Whisper transcribes audio descriptions

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes (Server Actions)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: Google Gemini API, OpenAI Whisper
- **Search**: Algolia
- **Email**: SendGrid
- **Hosting**: Vercel

## Project Structure

```
mavfind/
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/              # Admin endpoints
│   │   │   ├── lost/           # Add found items
│   │   │   ├── requests/       # Manage user requests
│   │   │   └── session/        # Admin session management
│   │   ├── auth/               # NextAuth configuration
│   │   ├── inventory/          # Search inventory
│   │   ├── notify/             # Notification preferences
│   │   ├── queues/             # Background job queues
│   │   └── requests/           # User lost item reports
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # User and admin dashboards
│   ├── inventory/              # Public inventory search
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── admin/                  # Admin components
│   ├── shared/                 # Shared components
│   └── user/                   # User components
├── lib/
│   ├── ai/                     # AI integrations
│   │   ├── gemini.ts           # Google Gemini
│   │   └── whisper.ts          # OpenAI Whisper
│   ├── auth/                   # Auth configuration
│   ├── email/                  # Email notifications
│   ├── firebase/               # Firebase utilities
│   │   ├── admin.ts            # Firebase Admin SDK
│   │   ├── firestore.ts        # Firestore operations
│   │   └── storage.ts          # File storage
│   └── search/                 # Algolia search
├── types/                      # TypeScript types
├── firestore.rules             # Firestore security rules
├── .env.example                # Environment variables template
└── vercel.json                 # Vercel deployment config
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Firebase project
- Google Cloud account (for Gemini AI)
- OpenAI account (for Whisper)
- Algolia account
- SendGrid account
- Google OAuth credentials

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd mavfind
npm install
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# AI APIs
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=your-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your-search-key
ALGOLIA_ADMIN_API_KEY=your-admin-key
ALGOLIA_INDEX_NAME=mavfind_items

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Cron (for Vercel)
CRON_SECRET=generate-random-secret
```

### 6. Firestore Data Initialization

Create initial location data in Firestore:

1. Go to Firebase Console → Firestore Database
2. Create a collection named `info`
3. Create a document with ID `location`
4. Add the following data:

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

### 7. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from `firestore.rules` to your Firebase Console.

### 8. Algolia Index Setup

1. Create an index named `mavfind_items` in Algolia
2. The search settings will be configured automatically when items are indexed

### 9. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

4. The cron job for email notifications will run automatically every 5 minutes

### Environment Variables in Production

Make sure to add all environment variables from `.env` to your Vercel project settings.

## API Endpoints

### User Endpoints
- `POST /api/requests` - Create lost item report
- `GET /api/requests/mine` - Get user's reports
- `GET /api/inventory` - Search inventory
- `POST /api/notify/subscribe` - Update notification preferences

### Admin Endpoints
- `POST /api/admin/session/location` - Set admin location
- `POST /api/admin/lost` - Add found item
- `POST /api/admin/requests/approve` - Approve request
- `POST /api/admin/requests/reject` - Reject request
- `POST /api/admin/requests/match` - Match request with found item

### Background Jobs
- `POST /api/queues/notifications/enqueue` - Enqueue notification
- `POST /api/queues/notifications/dispatch` - Process notification queue (cron)

## User Roles

### Creating Admin Users

By default, new users are created with the `user` role. To make a user an admin:

1. Go to Firestore Console
2. Navigate to `users` collection
3. Find the user document (by UID)
4. Change `role` from `"user"` to `"admin"`

## Development

### Running Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

## Architecture Decisions

### Server-Only Writes
All Firestore writes happen through Next.js server functions. This ensures:
- Security: Users can't bypass business logic
- Validation: All data is validated server-side
- Consistency: Centralized data processing

### AI Integration
- **Gemini AI**: Extracts structured attributes from natural language descriptions
- **Whisper**: Converts voice input to text for accessibility

### Search Strategy
- **Algolia**: Provides fast, typo-tolerant search across all items
- Items are automatically indexed when created
- Real-time search with filters for category and location

### Notification System
- Uses a queue-based approach for reliability
- Cron job processes pending emails every 5 minutes
- Supports user preferences for targeted notifications

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify your service account credentials are correct
   - Check that private key includes `\n` characters properly escaped

2. **Algolia Search Not Working**
   - Ensure items are being indexed (check Algolia dashboard)
   - Verify API keys are correct
   - Run index configuration: `configureIndexSettings()`

3. **Email Notifications Not Sending**
   - Check SendGrid API key
   - Verify CRON_SECRET is set correctly
   - Check Vercel cron logs

4. **OAuth Login Fails**
   - Verify redirect URIs in Google Console
   - Check NEXTAUTH_URL matches your domain
   - Ensure NEXTAUTH_SECRET is set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
