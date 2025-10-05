# Algolia Filter Configuration

The filters in your admin dashboard are empty because Algolia needs to know which attributes can be used for filtering (facets).

## Option 1: Configure via Algolia Dashboard (Easiest)

1. Go to https://www.algolia.com/apps/{YOUR_APP_ID}/explorer
2. Select your index: `mavfind_lost_items` or `mavfind_lost_items_requests`
3. Go to **Configuration** tab
4. Click **Facets** in the sidebar
5. Add these attributes for faceting:
   - `category`
   - `lostOrFound`
   - `status`
   - `locationId`
   - `attributes.category`

6. Make them **searchable** (click the filter icon next to each)
7. Click **Review and Save Settings**
8. Repeat for the other index

## Option 2: Use the Configuration Script

1. Get your **Admin API Key** from: https://www.algolia.com/account/api-keys/
   - ⚠️ Keep this secret! Never commit it to git

2. Add it to your `.env` file:
   ```
   ALGOLIA_ADMIN_API_KEY=your_admin_api_key_here
   ```

3. Install tsx if you don't have it:
   ```bash
   npm install -D tsx
   ```

4. Run the configuration script:
   ```bash
   npx tsx scripts/configure-algolia.ts
   ```

## Verify Configuration

After configuring, you can verify by:

1. Going to Algolia Dashboard → Your Index → Configuration → Facets
2. You should see the attributes listed there
3. Refresh your admin dashboard and the filters should now show values

## Troubleshooting

**Filters still empty?**
- Make sure your documents in Algolia actually have these fields
- Check if Firebase functions are properly syncing to Algolia
- Verify the field names match exactly (case-sensitive)

**No documents in Algolia?**
- You may need to manually trigger a sync from Firestore to Algolia
- Check your Firebase Functions logs for any sync errors
