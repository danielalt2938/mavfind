# Firestore Security Rules

Add these rules to your `firestore.rules` file to secure the vector search system.

## Complete Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    function isServiceAccount() {
      return isAuthenticated() &&
             request.auth.token.firebase.sign_in_provider == 'service_account';
    }

    // Requests collection (user-reported lost items)
    match /requests/{requestId} {
      // Users can read and write their own requests
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isAdmin();

      // Service accounts can write embedding fields
      allow update: if isServiceAccount() &&
                    request.resource.data.diff(resource.data).affectedKeys()
                      .hasAny(['embedding', 'embeddingDim', 'embeddingAt']);

      // Matches subcollection
      match /matches/{lostId} {
        // Users can read their own matches
        allow read: if isOwner(get(/databases/$(database)/documents/requests/$(requestId)).data.userId);

        // Users can update match status (accept/reject)
        allow update: if isOwner(get(/databases/$(database)/documents/requests/$(requestId)).data.userId) &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['status', 'updatedAt']);

        // Service accounts can write all fields
        allow write: if isServiceAccount();

        // Admins have full access
        allow write: if isAdmin();
      }
    }

    // Lost collection (admin-logged found items)
    match /lost/{lostId} {
      // Anyone can read found items (public catalog)
      allow read: if true;

      // Only admins can write
      allow write: if isAdmin();

      // Service accounts can write embedding fields
      allow update: if isServiceAccount() &&
                    request.resource.data.diff(resource.data).affectedKeys()
                      .hasAny(['embedding', 'embeddingDim', 'embeddingAt']);
    }

    // Deny all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Key Security Principles

### 1. User Requests
- ✅ Users can only read/write their own requests
- ✅ Service accounts can write embedding fields
- ✅ Admins can delete any request

### 2. Found Items (Lost Collection)
- ✅ Public read access (anyone can browse found items)
- ✅ Only admins can create/update/delete
- ✅ Service accounts can write embeddings

### 3. Matches Subcollection
- ✅ Users can read their own matches
- ✅ Users can update status field only (accept/reject)
- ✅ Service accounts have full write access (for backend)
- ✅ Admins have full access

### 4. Embedding Fields Protection
- 🔒 Only service accounts can write `embedding`, `embeddingDim`, `embeddingAt`
- 🔒 Prevents users from tampering with vector data
- 🔒 Ensures embeddings are only created by trusted backend

## Testing Rules

Use the Firestore Rules Simulator in Firebase Console:

### Test 1: User reads own request
```javascript
// Auth: user123
// Operation: get /requests/REQ123 (where userId == 'user123')
// Expected: ✅ Allow
```

### Test 2: User reads another user's request
```javascript
// Auth: user123
// Operation: get /requests/REQ456 (where userId == 'user456')
// Expected: ❌ Deny
```

### Test 3: Service account writes embedding
```javascript
// Auth: service_account
// Operation: update /requests/REQ123 { embedding: [...], embeddingDim: 768 }
// Expected: ✅ Allow
```

### Test 4: User tries to write embedding
```javascript
// Auth: user123
// Operation: update /requests/REQ123 { embedding: [...] }
// Expected: ❌ Deny
```

### Test 5: User updates match status
```javascript
// Auth: user123 (owns REQ123)
// Operation: update /requests/REQ123/matches/LOST456 { status: 'accepted', updatedAt: now }
// Expected: ✅ Allow
```

### Test 6: User updates match distance
```javascript
// Auth: user123 (owns REQ123)
// Operation: update /requests/REQ123/matches/LOST456 { distance: 0.1 }
// Expected: ❌ Deny (can only update status/updatedAt)
```

## Custom Claims

### Set Admin Claim
```bash
# Using Firebase CLI
firebase auth:set-custom-user-claims uid --claims='{"admin":true}'

# Using Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
```

### Verify Claims in Frontend
```typescript
const idTokenResult = await user.getIdTokenResult();
const isAdmin = idTokenResult.claims.admin === true;
```

## Deployment

1. Save rules to `firestore.rules`
2. Deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Test in Firebase Console → Firestore → Rules → Playground
