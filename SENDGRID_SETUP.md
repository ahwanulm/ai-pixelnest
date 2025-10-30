# 📧 SendGrid Email Service Setup Guide

## Overview

PixelNest sekarang menggunakan **SendGrid** sebagai email service untuk mengirim email aktivasi, reset password, dan email lainnya. SendGrid lebih reliable dan memiliki deliverability rate yang lebih baik dibanding SMTP biasa.

## ✅ Migration Completed

Sistem email telah diubah dari Nodemailer SMTP ke SendGrid API:
- ✅ Package `@sendgrid/mail` terinstall
- ✅ Database migration selesai
- ✅ Email service updated
- ✅ Admin Panel UI ready

## 🚀 Quick Setup

### 1. Create SendGrid Account

1. Daftar di [SendGrid](https://signup.sendgrid.com/)
2. Verifikasi email Anda
3. Login ke SendGrid Dashboard

### 2. Create API Key

1. Buka [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate: **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: `PixelNest Production` (atau nama lain)
5. Permission: **Full Access** (atau minimal Mail Send)
6. Click **Create & View**
7. **Copy API Key** (dimulai dengan `SG.xxx...`)
   - ⚠️ **PENTING**: API Key hanya ditampilkan sekali!

### 3. Verify Sender Email

SendGrid memerlukan verifikasi sender email sebelum bisa mengirim email.

#### Single Sender Verification (Recommended for Testing)
1. Navigate: **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill form dengan email Anda (contoh: `noreply@yourdomain.com`)
4. Check email inbox dan klik link verifikasi
5. Email terverifikasi ✅

#### Domain Authentication (Recommended for Production)
1. Navigate: **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow instructions untuk menambahkan DNS records
4. Tunggu DNS propagation (bisa sampai 48 jam)

### 4. Configure via Admin Panel

1. Login ke **Admin Panel**: `http://your-domain.com/admin`
2. Navigate: **API Configs**
3. Find **SENDGRID** card
4. Click **Configure**
5. Fill in:
   - **SendGrid API Key**: `SG.xxx...` (dari Step 2)
   - **Email From**: Email yang sudah diverifikasi (dari Step 3)
   - **Sender Name**: `PixelNest` (atau nama lain)
   - **Endpoint URL**: `https://api.sendgrid.com/v3` (default)
6. Check **Enable this API service**
7. Click **Save Configuration**

### 5. Test Email

Test apakah email berfungsi:

1. **Register new account** di website
2. Check apakah activation email terkirim
3. Check SendGrid Dashboard → **Activity** untuk melihat status email

## 🔧 Manual Configuration (.env)

Jika ingin konfigurasi via `.env` file (optional):

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_USER=noreply@yourdomain.com  # Fallback
```

Kemudian run migration:
```bash
npm run migrate:sendgrid
```

## 📊 Admin Panel Features

Admin Panel sekarang support penuh untuk SendGrid:

### View Configuration
- API Key status (masked)
- Email From address
- Sender Name
- Endpoint URL
- Active/Inactive status

### Edit Configuration
- Update API Key
- Change Email From
- Modify Sender Name
- Enable/Disable service

### Visual Indicators
- ✅ Active/Inactive badge
- 🔗 Quick link to SendGrid Dashboard
- ℹ️ Setup instructions

## 📧 Email Features

SendGrid digunakan untuk:

1. **Activation Email** - Kode aktivasi akun (6 digit)
2. **Welcome Email** - Email selamat datang setelah aktivasi
3. **Password Reset** - Kode reset password (6 digit)
4. **Future emails** - Newsletter, notifications, dll

## 🔍 Troubleshooting

### Error: "SendGrid not configured"
**Solution**: 
- Pastikan API Key sudah diisi di Admin Panel
- Check apakah service diaktifkan (toggle Active)
- Restart server: `npm run dev`

### Email not received
**Solution**:
- Check SendGrid Dashboard → Activity Feed
- Verify sender email sudah terverifikasi
- Check spam folder
- Verify API Key masih valid (tidak expired/revoked)

### Error: "403 Forbidden"
**Solution**:
- Check API Key permission (harus Mail Send atau Full Access)
- Regenerate API Key jika perlu

### Error: "Sender not verified"
**Solution**:
- Verify sender email di SendGrid Dashboard
- Atau use domain authentication
- Pastikan email di config sama dengan yang diverifikasi

## 📈 SendGrid Free Tier

SendGrid free tier includes:
- **100 emails/day** (sufficient untuk testing)
- Email templates
- Activity tracking
- Basic analytics
- API access

Untuk production, consider upgrade ke paid plan.

## 🔗 Useful Links

- [SendGrid Dashboard](https://app.sendgrid.com/)
- [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
- [Activity Feed](https://app.sendgrid.com/email_activity)

## 💡 Best Practices

1. **Never commit API keys** ke Git
2. **Use verified sender email** untuk production
3. **Monitor email activity** di SendGrid Dashboard
4. **Implement rate limiting** untuk prevent abuse
5. **Use templates** untuk konsistensi email
6. **Track email metrics** (open rate, click rate, dll)

## 🎯 Migration Notes

### What Changed?
- **Before**: Nodemailer with SMTP (Gmail/custom)
- **After**: SendGrid with REST API

### Why SendGrid?
- ✅ Better deliverability rate
- ✅ No SMTP configuration needed
- ✅ Built-in tracking & analytics
- ✅ Easier to manage
- ✅ More reliable
- ✅ Better for scaling

### Backward Compatibility
- Existing email functions tetap work
- API sama (no code changes needed)
- Configuration via Admin Panel

## 🚨 Important Notes

1. **API Key Security**: 
   - Store API key securely
   - Never expose di client-side code
   - Rotate keys periodically

2. **Sender Verification**:
   - Wajib verify sender sebelum production
   - Test dengan single sender verification
   - Use domain authentication untuk production

3. **Email Limits**:
   - Free tier: 100 emails/day
   - Monitor usage di Dashboard
   - Upgrade plan jika perlu

4. **Testing**:
   - Test di sandbox mode dulu
   - Verify all email types work
   - Check deliverability

## 📞 Support

Jika ada masalah:
1. Check error logs di terminal
2. Check SendGrid Activity Feed
3. Review configuration di Admin Panel
4. Check dokumentasi SendGrid

---

**Setup Time**: ~10 minutes  
**Difficulty**: Easy  
**Status**: ✅ Production Ready  

Happy emailing! 📧

