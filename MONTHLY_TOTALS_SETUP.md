# Monthly Totals Feature - Setup Guide

## 📊 What's New

The app now displays monthly totals at the top:
- **Current month name** (e.g., "January 2026")
- **Total GBP spent** this month
- **Total EUR spent** this month  
- **Entry count** for the month
- **Refresh button** (🔄) to update totals

## 🔧 Setup Steps

### 1. Update Google Apps Script

**IMPORTANT:** You must replace your existing Apps Script code with the new version!

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. **Delete ALL existing code**
4. Copy and paste the **entire** `GoogleAppsScript.js` file
5. Click **💾 Save**

### 2. Test the New Endpoint

In Apps Script:
1. Select function: **testMonthlyTotals** from dropdown
2. Click **Run**
3. Check **Execution log** - should show monthly totals JSON
4. Click **Deploy → Test deployments**
5. Copy the test URL and add `?action=monthlyTotals`
6. Open in browser - should return JSON like:
   ```json
   {
     "success": true,
     "data": {
       "year": 2026,
       "month": 1,
       "monthName": "January",
       "totalGBP": 125.50,
       "totalEUR": 45.00,
       "entryCount": 8
     }
   }
   ```

### 3. Deploy PWA Updates

```bash
# Replace the PWA files
git add index.html app.js styles.css
git commit -m "Add monthly totals feature"
git push
```

### 4. Clear Cache & Test

**On your phone:**
1. Close the PWA completely
2. Open Chrome → Settings → Site settings
3. Find your site → Clear & reset
4. Reopen the PWA
5. You should see monthly totals at the top!

## ✅ Expected Behavior

**On Startup:**
- App loads
- Monthly totals section shows at top with gradient background
- Shows current month name (e.g., "January")
- Shows £0.00 and €0.00 initially
- Fetches real totals from Google Sheet
- Updates display with actual totals

**After Submitting Entry:**
- Entry is saved
- Monthly totals **automatically refresh**
- New totals include the entry you just added

**Refresh Button (🔄):**
- Click to manually refresh totals
- Button spins while loading
- Updates with latest data from sheet

## 🎨 Visual Layout

```
┌─────────────────────────────┐
│ 💰 Travel Costs        ⚙️   │ ← Header
├─────────────────────────────┤
│ ● online     2 queued       │ ← Status Bar
├─────────────────────────────┤
│ January                  🔄 │ ← Monthly Totals (gradient)
│ ┌──────────┐ ┌──────────┐  │
│ │GBP Total │ │EUR Total │  │
│ │ £125.50  │ │  €45.00  │  │
│ └──────────┘ └──────────┘  │
│     8 entries this month    │
├─────────────────────────────┤
│ £ GBP    € EUR              │ ← Currency selector
├─────────────────────────────┤
│ Cost buttons...             │
```

## 🐛 Troubleshooting

### Issue: Totals show £0.00 / €0.00

**Solution:**
1. Open browser console (F12)
2. Look for: `📊 Fetching monthly totals from:`
3. Click the URL in console
4. Check if JSON returns correct data
5. If 404 error → Apps Script not deployed correctly
6. If CORS error → Deploy must have "Anyone" access

### Issue: "Failed to load monthly totals"

**Solution:**
1. Verify Apps Script deployed as Web App
2. Check "Execute as: Me"
3. Check "Who has access: Anyone"
4. Try redeploying: Deploy → Manage deployments → Edit → Version: New version

### Issue: Totals don't update after submitting

**Solution:**
1. Check console for errors
2. The app calls `loadMonthlySummary()` after successful submit
3. If offline, totals won't update until back online
4. Click refresh button (🔄) manually

## 📝 API Endpoints

Your Google Apps Script now supports:

**GET Requests:**
- `?action=monthlyTotals` - Current month
- `?action=monthlyTotals&year=2026&month=1` - Specific month

**POST Requests:**
- Submit entry (unchanged)

## 🔐 Security Note

The GET endpoint is public (required for CORS). This means anyone with your URL can see your monthly totals. If this is a concern:
- Use a private spreadsheet
- Don't share the script URL
- Consider adding authentication in future

## 🎉 That's It!

Your app now shows monthly totals right at the top, calculated directly from your Google Sheet data!
