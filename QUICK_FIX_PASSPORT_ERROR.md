# ⚡ Quick Fix: Passport Deserialize Error

## 🔴 Error
```
Error: Failed to deserialize user out of session
GET /login 500 2.240 ms - -
```

## ✅ Solution (Choose One)

### Option 1: Clear Browser Cookies (Fastest)
1. Clear browser cookies/cache
2. Restart browser
3. Login again

### Option 2: Clear Database Sessions (Recommended)
```bash
npm run cleanup:sessions
```

### Option 3: Nuclear Option (Clear All)
```bash
psql pixelnest_db -c "DELETE FROM sessions;"
```

⚠️ This will logout all users!

## 🔧 What Was Fixed

✅ **Improved Error Handling**
- File: `src/config/passport.js`
- File: `src/models/User.js`
- No more server crash pada invalid sessions

✅ **Session Cleanup Script**
- File: `src/scripts/clearStaleSessions.js`
- Command: `npm run cleanup:sessions`

✅ **Better Logging**
```
⚠️  Passport deserialize: User ID 123 not found
⚠️  Passport deserialize: User is inactive
```

## 🚀 Ready!

Error sudah diperbaiki. Server tidak akan crash lagi saat ada session invalid!

---

📚 **Detailed Docs:** `FIX_PASSPORT_DESERIALIZE_ERROR.md`

