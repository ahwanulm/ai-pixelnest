# 🚀 Admin Panel - Quick Start Guide

## Prerequisites

Make sure you have already:
1. ✅ Installed all dependencies (`npm install`)
2. ✅ Set up your database (PostgreSQL)
3. ✅ Created the main database tables (`npm run init-db`)
4. ✅ Configured your `.env` file

---

## Quick Setup (3 Steps)

### Step 1: Initialize Admin Tables

Run this command to create all admin-related database tables:

```bash
npm run init-admin
```

This creates:
- `promo_codes` table
- `api_configs` table
- `notifications` table
- `user_activity_logs` table
- `credit_transactions` table
- `ai_generation_history` table
- `admin_settings` table

And adds admin columns to `users` table.

### Step 2: Register Your Admin Account

1. Go to http://localhost:5005/register
2. Create a new account with your email and password
3. Complete the registration

### Step 3: Promote User to Admin

Run this command and enter your email:

```bash
npm run make-admin
```

Example:
```
Enter user email: admin@pixelnest.id
✅ User successfully promoted to admin!
```

---

## Access Admin Panel

1. **Login** at: http://localhost:5005/login
2. **Access Admin** at: http://localhost:5005/admin

You'll see an "Admin Panel" link in your user dropdown menu.

---

## What Can You Do?

### 📊 Dashboard
- View system statistics
- Monitor user activity
- Quick actions

### 👥 User Management
- View all users
- Edit user details
- Add/remove credits
- View user activity
- Delete users

### 🎟️ Promo Codes
- Create discount codes
- Set credit bonuses
- Track usage
- Set expiration dates

### ⚙️ API Configuration
- Manage API keys (FAL AI, OpenAI, etc.)
- Configure endpoints
- Set rate limits

### 🔔 Notifications
- Send notifications to users
- Broadcast to all users
- Set priority and types

### 📝 Activity Logs
- Track all user actions
- View admin activities
- Monitor system usage

### 🔧 System Settings
- Configure default credits
- Set credit costs
- Enable/disable features

---

## Troubleshooting

### "Access Denied" Error
Make sure you ran `npm run make-admin` with your email.

Check your role in database:
```sql
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

### Database Errors
Re-run the initialization:
```bash
npm run init-admin
```

### Can't See Admin Link
Make sure:
1. You're logged in
2. Your user role is 'admin'
3. Server is running
4. Clear browser cache

---

## Example: Give User 100 Credits

1. Go to `/admin/users`
2. Click on the user
3. Click "Add Credits"
4. Enter: `100`
5. Description: "Welcome bonus"
6. Submit

---

## Example: Create Promo Code

1. Go to `/admin/promo-codes`
2. Click "Create Promo Code"
3. Fill in:
   - Code: `WELCOME20`
   - Type: Percentage
   - Value: 20
   - Credits Bonus: 50
   - Max Uses: 100
4. Click "Create"

---

## Security Notes

⚠️ **Important:**
- Never share your admin credentials
- Admin actions are logged
- API keys are hidden in UI
- You cannot delete your own admin account

---

## Next Steps

1. Configure your API keys in `/admin/api-configs`
2. Set up default credits in `/admin/settings`
3. Create welcome promo codes
4. Send a welcome notification to users

---

## Need Help?

📖 **Full Documentation:** See [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md)

🐛 **Issues:** Check the server logs for errors

💡 **Tips:** All admin actions are logged in the activity logs

---

**Ready to manage your PixelNest platform! 🎉**

