# 🔄 Referral System - Flow Diagram

## 📊 Visual Flow

### 🔗 Alur 1: Email/Password Registration dengan Referral Code

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER MENDAPAT LINK REFERRAL                  │
│              http://localhost:5005/register?ref=EY6QZOEO        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /register?ref=EY6QZOEO                              │
│  Controller: authController.showRegister()                       │
│  Action: res.redirect('/login?ref=EY6QZOEO')                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /login?ref=EY6QZOEO                                 │
│  Controller: authController.showLogin()                          │
│  View: auth/login.ejs                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟢 Banner: "Kode referral aktif! Daftar sekarang..."     │ │
│  │                                                            │ │
│  │ [Continue with Google?ref=EY6QZOEO]  ◄── Pass ref code   │ │
│  │                                                            │ │
│  │ OR                                                         │ │
│  │                                                            │ │
│  │ Email: [_________________]                                │ │
│  │ <hidden input name="referralCode" value="EY6QZOEO">      │ │
│  │ [Continue] ──> POST /auth/check-email?ref=EY6QZOEO       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: POST /auth/check-email?ref=EY6QZOEO                     │
│  Body: { email: "user@gmail.com", referralCode: "EY6QZOEO" }   │
│  Controller: authController.checkEmail()                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Check: User exists?                                        │ │
│  │   ✅ YES → Show password page                             │ │
│  │   ❌ NO  → Show register page (with referralCode)         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  View: auth/register.ejs                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Email: user@gmail.com (pre-filled)                        │ │
│  │ <hidden input name="referralCode" value="EY6QZOEO">      │ │
│  │                                                            │ │
│  │ Name: [_________________]                                 │ │
│  │ Password: [_________________]                             │ │
│  │ [ ] Terms & Conditions                                    │ │
│  │                                                            │ │
│  │ [Create Account] ──> POST /auth/register                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: POST /auth/register                                     │
│  Body: {                                                        │
│    name, email, password, ...,                                 │
│    referralCode: "EY6QZOEO"                                    │
│  }                                                              │
│  Controller: authController.register()                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. Validate input                                          │ │
│  │ 2. User.createWithPassword(...)                           │ │
│  │ 3. Send activation email                                   │ │
│  │ 4. if (referralCode):                                     │ │
│  │      Referral.setReferredBy(newUser.id, referralCode)    │ │
│  │      console.log("✅ Referral code applied...")           │ │
│  │ 5. Show verification page                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database: users table                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ INSERT INTO users (                                        │ │
│  │   email: "user@gmail.com",                                │ │
│  │   referred_by: 123,  ◄── ID of referrer (from code)      │ │
│  │   is_active: false   ◄── Needs email verification        │ │
│  │ )                                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  User verifies email → is_active = true → DONE ✅               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🔗 Alur 2: Google OAuth Registration dengan Referral Code

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER MENDAPAT LINK REFERRAL                  │
│              http://localhost:5005/register?ref=EY6QZOEO        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /register?ref=EY6QZOEO                              │
│  Redirect to: /login?ref=EY6QZOEO                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /login?ref=EY6QZOEO                                 │
│  View: auth/login.ejs                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟢 Banner: "Kode referral aktif!"                         │ │
│  │                                                            │ │
│  │ [Continue with Google] ◄── href="/auth/google?ref=..."   │ │
│  │                                                            │ │
│  │ User clicks button                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /auth/google?ref=EY6QZOEO                           │
│  File: src/routes/auth.js                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ if (req.query.ref) {                                       │ │
│  │   req.session.referralCode = req.query.ref;  ◄── SAVE!   │ │
│  │   console.log("🔗 Referral code saved to session");       │ │
│  │ }                                                          │ │
│  │                                                            │ │
│  │ passport.authenticate('google', ...)                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REDIRECT TO GOOGLE                       │
│                   https://accounts.google.com/...               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ User logs in with Google                                   │ │
│  │ User authorizes app                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route: GET /auth/google/callback                               │
│  File: src/config/passport.js                                   │
│  Strategy: GoogleStrategy (passReqToCallback: true)             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ async (req, accessToken, refreshToken, profile, done) {   │ │
│  │                                                            │ │
│  │   // Check if user exists                                 │ │
│  │   let user = await User.findByGoogleId(profile.id);      │ │
│  │                                                            │ │
│  │   if (!user) {  ◄── NEW USER                              │ │
│  │     // Get referral from session                          │ │
│  │     const code = req.session?.referralCode || null;       │ │
│  │                                                            │ │
│  │     // Create user with referral                          │ │
│  │     user = await User.createFromGoogle(profile, code);   │ │
│  │                                                            │ │
│  │     // Clear session                                      │ │
│  │     delete req.session.referralCode;                      │ │
│  │                                                            │ │
│  │     console.log("✅ New user via OAuth with ref: "+code);│ │
│  │   }                                                        │ │
│  │                                                            │ │
│  │   return done(null, user);                                │ │
│  │ }                                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Model: User.createFromGoogle(profile, referralCode)           │
│  File: src/models/User.js                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. Insert user ke database:                                │ │
│  │    - google_id, email, name, avatar_url                   │ │
│  │    - credits (from default settings)                      │ │
│  │    - is_active: true  ◄── Auto-activated!                │ │
│  │                                                            │ │
│  │ 2. const newUser = result.rows[0];                        │ │
│  │                                                            │ │
│  │ 3. if (referralCode) {                                    │ │
│  │      const success = await Referral.setReferredBy(        │ │
│  │        newUser.id,                                        │ │
│  │        referralCode                                       │ │
│  │      );                                                    │ │
│  │                                                            │ │
│  │      if (success) {                                       │ │
│  │        console.log("✅ Referral code applied (OAuth)");   │ │
│  │      }                                                     │ │
│  │    }                                                       │ │
│  │                                                            │ │
│  │ 4. return newUser;                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Model: Referral.setReferredBy(userId, referralCode)           │
│  File: src/models/Referral.js                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. const referrer = await getReferrerByCode(code);        │ │
│  │                                                            │ │
│  │ 2. if (referrer) {                                        │ │
│  │      UPDATE users                                         │ │
│  │      SET referred_by = referrer.id  ◄── LINK!            │ │
│  │      WHERE id = userId;                                   │ │
│  │                                                            │ │
│  │      return true;                                         │ │
│  │    }                                                       │ │
│  │                                                            │ │
│  │ 3. return false;  // Invalid code                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database: users table                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Row:                                                       │ │
│  │   id: 456                                                 │ │
│  │   email: "newuser@gmail.com"                              │ │
│  │   google_id: "1234567890..."                              │ │
│  │   referred_by: 123  ◄── Referrer's user ID               │ │
│  │   is_active: true   ◄── Auto-activated                   │ │
│  │   credits: 100      ◄── Default credits                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Redirect to: /dashboard                                        │
│  User logged in and ready to use! ✅                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Components

### 📦 Session Storage

```
┌─────────────────────────────────────────────────────────────────┐
│  Session Lifecycle for Google OAuth Referral                    │
└─────────────────────────────────────────────────────────────────┘
                                  
1. SAVE (Before OAuth redirect)
   ┌──────────────────────────────┐
   │ req.session.referralCode     │
   │ = req.query.ref              │
   │                              │
   │ Stored in: PostgreSQL        │
   │ Table: sessions              │
   └──────────────────────────────┘
                │
                ▼
2. PERSIST (During OAuth flow)
   ┌──────────────────────────────┐
   │ User → Google                │
   │ Google → Callback            │
   │                              │
   │ Session remains in database  │
   │ Connected via session cookie │
   └──────────────────────────────┘
                │
                ▼
3. RETRIEVE (After OAuth callback)
   ┌──────────────────────────────┐
   │ const code =                 │
   │   req.session.referralCode   │
   │                              │
   │ Use for user creation        │
   └──────────────────────────────┘
                │
                ▼
4. CLEANUP (After use)
   ┌──────────────────────────────┐
   │ delete req.session.          │
   │   referralCode               │
   │                              │
   │ Prevent reuse                │
   └──────────────────────────────┘
```

---

## 📊 Database Relationships

```sql
┌──────────────────────────────────────────────────────────────┐
│  TABLE: users                                                 │
├──────────────────────────────────────────────────────────────┤
│  id                  SERIAL PRIMARY KEY                       │
│  email               VARCHAR                                  │
│  name                VARCHAR                                  │
│  google_id           VARCHAR  (NULL for email/password)      │
│  password_hash       VARCHAR  (NULL for Google OAuth)        │
│  referral_code       VARCHAR  (Own code for sharing)         │
│  referred_by         INTEGER  → users.id (Who referred this) │
│  referral_earnings   DECIMAL  (Commission earned)            │
│  is_active           BOOLEAN  (Email verified?)              │
│  credits             DECIMAL  (Available credits)            │
│  created_at          TIMESTAMP                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Self-referencing relationship
                              ▼
              ┌───────────────────────────────┐
              │  User A (Referrer)            │
              │  id: 123                      │
              │  email: referrer@gmail.com    │
              │  referral_code: "EY6QZOEO"    │
              │  referred_by: NULL            │
              └───────────────────────────────┘
                              ▲
                              │
                              │ referred_by = 123
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────────────────┐       ┌─────────────────────┐
    │  User B (Referred)  │       │  User C (Referred)  │
    │  id: 456            │       │  id: 789            │
    │  email: b@gmail.com │       │  email: c@gmail.com │
    │  referred_by: 123   │       │  referred_by: 123   │
    │  google_id: "..."   │       │  password_hash: ... │
    │  (Google OAuth)     │       │  (Email/Password)   │
    └─────────────────────┘       └─────────────────────┘
```

---

## 🎯 Success Indicators

### ✅ Successful Email/Password Registration
```
Console Logs:
  ✅ Activation email sent to user@gmail.com with code: 123456
  ✅ Referral code EY6QZOEO applied to user user@gmail.com (Email/Password)

Database:
  users table:
    email: "user@gmail.com"
    referred_by: 123  ✅
    is_active: false (until email verified)
    password_hash: [hashed]
    google_id: NULL
```

### ✅ Successful Google OAuth Registration
```
Console Logs:
  🔗 Referral code saved to session: EY6QZOEO
  ✅ New user created via Google OAuth: user@gmail.com with referral code: EY6QZOEO
  ✅ Referral code EY6QZOEO applied to user user@gmail.com (Google OAuth)

Database:
  users table:
    email: "user@gmail.com"
    referred_by: 123  ✅
    is_active: true  ✅ (auto-activated)
    google_id: "1234567890..."
    password_hash: NULL
  
  sessions table:
    (referralCode removed after use)
```

---

## 🚫 Error Scenarios

### ❌ Invalid Referral Code
```
Flow:
  User uses: /register?ref=INVALID123
  System checks: getReferrerByCode("INVALID123")
  Result: No user found with this code
  
Console Log:
  ⚠️ Invalid referral code INVALID123 for user test@gmail.com

Database:
  referred_by: NULL  (not set)
  
User Experience:
  Registration still succeeds
  Just no referral tracking
```

### ❌ Session Lost (Rare)
```
Scenario:
  User clicks Google OAuth
  Session expires/cleared before callback
  
Result:
  referralCode not found in session
  User created without referral
  
Console Log:
  ✅ New user created via Google OAuth: user@gmail.com
  (No referral code mentioned)
```

---

**🎉 Visual flow selesai! Gunakan diagram ini untuk debugging dan training.**

