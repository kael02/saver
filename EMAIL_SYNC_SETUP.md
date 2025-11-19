# Email Sync Setup Guide

## Problem: Email-synced expenses not showing up?

If you're successfully parsing emails but they don't appear in your expense list, it's likely because they're not associated with your user account.

## Solution: Configure Email Sync User ID

Email-synced expenses need to be associated with a user ID so they appear in your expense list.

### Step 1: Get Your User ID

#### Option A: From Supabase Dashboard (Easiest)

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Find your user account
4. Copy the **ID** (UUID format like: `a1b2c3d4-1234-5678-90ab-cdef12345678`)

#### Option B: Using SQL Query

In Supabase SQL Editor, run:

```sql
SELECT id, email FROM auth.users;
```

Copy the `id` for your email address.

### Step 2: Add to Environment Variables

Add to your `.env` file:

```bash
EMAIL_SYNC_USER_ID=a1b2c3d4-1234-5678-90ab-cdef12345678
```

Replace with your actual user ID from Step 1.

### Step 3: Apply Database Migration

If you haven't already, apply the duplicate detection migration:

**In Supabase SQL Editor:**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_email_unique
ON expenses (user_id, merchant, amount, transaction_date, source)
WHERE source = 'email';
```

This prevents duplicate email imports per user.

### Step 4: Fix Existing Expenses (Optional)

If you already have email-synced expenses with `NULL` user_id, update them:

```sql
-- Preview what will be updated
SELECT id, merchant, amount, transaction_date, user_id
FROM expenses
WHERE source = 'email' AND user_id IS NULL;

-- Update to your user ID (replace YOUR_USER_ID)
UPDATE expenses
SET user_id = 'a1b2c3d4-1234-5678-90ab-cdef12345678'
WHERE source = 'email' AND user_id IS NULL;
```

### Step 5: Test

1. Mark a Grab or VIB email as **unread**
2. Trigger **email sync** in the app
3. Check the logs:
   ```
   Associating expenses with user: a1b2c3d4-...
   ✓ Successfully inserted expense with ID: ...
   ```
4. **Refresh the app** - expenses should now appear!

## Verification Checklist

After setup, verify these in order:

- [ ] `EMAIL_SYNC_USER_ID` is set in `.env`
- [ ] User ID exists in `auth.users` table
- [ ] Database migration applied (unique index exists)
- [ ] Sync logs show: `Associating expenses with user: ...`
- [ ] Expenses inserted successfully (no RLS errors)
- [ ] Expenses appear in the app UI

## Troubleshooting

### Error: "Email sync user ID not configured"

**Problem:** `EMAIL_SYNC_USER_ID` not set in `.env`

**Solution:** Add it to `.env` and restart the server

### Expenses still not showing

**Problem:** User ID doesn't match the logged-in user

**Solution:** Make sure the `EMAIL_SYNC_USER_ID` matches the user you're logged in as

### RLS Policy Error

**Problem:** Using wrong Supabase client

**Solution:** The code already uses `supabaseAdmin` - ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Duplicate Key Error After Migration

**Problem:** Trying to re-import expenses that already exist

**Solution:** This is expected! The duplicate detection is working. Old expenses with `NULL` user_id are different from new ones with user_id set.

## Multi-User Setup (Future)

Currently, all email-synced expenses go to one user. For multi-user setups:

**Option 1:** Different email accounts per user
- Configure `EMAIL_USER` and `EMAIL_SYNC_USER_ID` per deployment
- Each user runs their own instance

**Option 2:** Email-to-user mapping
- Add a mapping table: `email_address` → `user_id`
- Update sync code to look up user by email account

**Option 3:** User authenticates before sync
- Make sync endpoint require authentication
- Use authenticated user's ID instead of env variable
- Each user syncs their own email account

## Environment Variable Reference

```bash
# Required for email sync
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SYNC_USER_ID=your-user-id-here

# Required for database access
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: AI parsing
OPENROUTER_API_KEY=your-openrouter-key
```

## Related Documentation

- `AI_EMAIL_PARSER.md` - AI parsing setup
- `DUPLICATE_DETECTION.md` - How duplicates are detected
- `.env.example` - All environment variables
