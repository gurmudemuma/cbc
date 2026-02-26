# Email Notification System - Setup Guide

## Overview
The email notification system has been integrated into your exporter registration workflow. Exporters will receive automatic email notifications at key stages of their registration journey.

---

## Notifications Implemented

### 1. Registration Submitted ✅
**Trigger**: When exporter completes registration
**Recipient**: Exporter
**Content**:
- Registration confirmation
- Application reference (username)
- Status: Pending Approval
- Next steps information

### 2. Profile Approved ✅
**Trigger**: When ECTA approves exporter profile
**Recipient**: Exporter
**Content**:
- Approval confirmation
- Login instructions
- Pre-registration steps overview
- Link to login page

### 3. Profile Rejected ✅
**Trigger**: When ECTA rejects exporter profile
**Recipient**: Exporter
**Content**:
- Rejection notification
- Reason for rejection
- Contact information for appeals
- Next steps

### 4. Qualification Stage Approved ✅
**Trigger**: When ECTA approves Laboratory, Taster, Competence, or License
**Recipient**: Exporter
**Content**:
- Stage approval confirmation
- Certificate/License number (if applicable)
- Issue and expiry dates
- Link to dashboard

### 5. License Expiring Soon ✅
**Trigger**: Scheduled check (30, 15, 7 days before expiry)
**Recipient**: Exporter
**Content**:
- Expiry warning
- Days until expiry
- License details
- Renewal instructions

---

## SMTP Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password

3. **Update `.env` file**:
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=ECTA Coffee Export System
FRONTEND_URL=http://localhost:5173
```

### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account**: https://sendgrid.com
2. **Generate API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the API key

3. **Update `.env` file**:
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@ecta.gov.et
SMTP_FROM_NAME=Ethiopian Coffee & Tea Authority
FRONTEND_URL=https://your-production-domain.com
```

### Option 3: AWS SES (Recommended for Production)

1. **Setup AWS SES**:
   - Verify your domain
   - Request production access
   - Create SMTP credentials

2. **Update `.env` file**:
```env
EMAIL_ENABLED=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM_EMAIL=noreply@ecta.gov.et
SMTP_FROM_NAME=Ethiopian Coffee & Tea Authority
FRONTEND_URL=https://your-production-domain.com
```

### Option 4: Microsoft 365 / Outlook

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=ECTA Coffee Export System
FRONTEND_URL=http://localhost:5173
```

---

## Testing Email Notifications

### Test 1: Registration Email
```bash
# Register a new exporter
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_exporter",
    "password": "password123",
    "email": "your-test-email@gmail.com",
    "companyName": "Test Coffee Exports",
    "tin": "TIN123456",
    "capitalETB": 50000000,
    "contactPerson": "John Doe",
    "phone": "+251911234567",
    "address": "Addis Ababa"
  }'

# Check your email for registration confirmation
```

### Test 2: Approval Email
```bash
# Login as ECTA admin
# Approve the exporter through the dashboard
# Or use API:

curl -X POST http://localhost:3000/api/ecta/registrations/test_exporter/approve \
  -H "Authorization: Bearer YOUR_ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments": "Approved for testing"}'

# Check email for approval notification
```

### Test 3: Rejection Email
```bash
curl -X POST http://localhost:3000/api/ecta/registrations/test_exporter/reject \
  -H "Authorization: Bearer YOUR_ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient capital documentation"}'

# Check email for rejection notification
```

---

## Troubleshooting

### Issue: No emails being sent

**Check 1: SMTP Configuration**
```bash
# Check if SMTP is configured
grep SMTP coffee-export-gateway/.env

# Verify EMAIL_ENABLED=true
```

**Check 2: Gateway Logs**
```bash
# Check gateway logs for email errors
docker logs coffee-gateway

# Look for:
# ✓ Email notification service initialized
# ✓ Email sent: <message-id>
# OR
# ⚠️  Email notifications disabled - SMTP not configured
```

**Check 3: SMTP Credentials**
- Verify username and password are correct
- For Gmail: Use App Password, not regular password
- For SendGrid: Use "apikey" as username
- Check if 2FA is enabled (required for Gmail)

### Issue: Emails going to spam

**Solution 1: SPF Records**
Add SPF record to your domain DNS:
```
v=spf1 include:_spf.google.com ~all
```

**Solution 2: DKIM**
Configure DKIM in your email provider settings

**Solution 3: DMARC**
Add DMARC record to your domain DNS:
```
v=DMARC1; p=none; rua=mailto:dmarc@ecta.gov.et
```

### Issue: Gmail blocking sign-in

**Solution**:
1. Enable 2-Factor Authentication
2. Generate App Password (don't use regular password)
3. Use App Password in SMTP_PASS

### Issue: Rate limiting

**Gmail Limits**:
- 500 emails per day (free)
- 2000 emails per day (Google Workspace)

**Solution for Production**:
- Use SendGrid (100 emails/day free, 40,000/month paid)
- Use AWS SES (62,000 emails/month free)
- Use dedicated SMTP service

---

## Email Templates Customization

### Modify Email Content

Edit `coffee-export-gateway/src/services/notification.service.js`:

```javascript
// Example: Change registration email subject
async notifyRegistrationSubmitted(user) {
  const subject = 'Your Custom Subject Here';
  const html = `
    <!-- Your custom HTML template -->
  `;
  return await this.sendEmail(user.email, subject, html);
}
```

### Add Company Logo

```javascript
const html = `
  <div style="text-align: center; padding: 20px;">
    <img src="https://your-domain.com/logo.png" 
         alt="ECTA Logo" 
         style="max-width: 200px;" />
  </div>
  <!-- Rest of email content -->
`;
```

### Change Color Scheme

```javascript
// Current: Purple gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Change to: Green gradient
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

// Change to: Blue gradient
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
```

---

## Production Checklist

### Before Going Live:

- [ ] Configure production SMTP service (SendGrid/AWS SES)
- [ ] Update SMTP credentials in production .env
- [ ] Set correct FRONTEND_URL (production domain)
- [ ] Test all email notifications
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Set up email monitoring/logging
- [ ] Configure bounce handling
- [ ] Set up unsubscribe mechanism (if required)
- [ ] Test email deliverability
- [ ] Monitor email sending limits

### Security:

- [ ] Never commit SMTP credentials to git
- [ ] Use environment variables for all secrets
- [ ] Rotate SMTP passwords regularly
- [ ] Monitor for unauthorized email sending
- [ ] Implement rate limiting
- [ ] Log all email sending attempts

---

## Monitoring & Logging

### Check Email Sending Status

```bash
# View gateway logs
docker logs -f coffee-gateway

# Look for:
✓ Email sent: <message-id>
✗ Failed to send email: <error>
```

### Email Delivery Tracking

For production, integrate with:
- **SendGrid**: Built-in analytics dashboard
- **AWS SES**: CloudWatch metrics
- **Mailgun**: Real-time analytics

### Add Custom Logging

```javascript
// In notification.service.js
async sendEmail(to, subject, html) {
  try {
    const info = await this.transporter.sendMail({...});
    
    // Log to database or external service
    await logEmailSent({
      to,
      subject,
      messageId: info.messageId,
      timestamp: new Date(),
      status: 'sent'
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log error
    await logEmailError({
      to,
      subject,
      error: error.message,
      timestamp: new Date()
    });
    
    return { success: false, error: error.message };
  }
}
```

---

## Advanced Features (Future Enhancements)

### 1. Email Queue System
Use Bull or Bee-Queue for reliable email delivery:
```javascript
const Queue = require('bull');
const emailQueue = new Queue('email', 'redis://localhost:6379');

emailQueue.process(async (job) => {
  await notificationService.sendEmail(
    job.data.to,
    job.data.subject,
    job.data.html
  );
});
```

### 2. Email Templates Engine
Use Handlebars or EJS for dynamic templates:
```javascript
const handlebars = require('handlebars');
const template = handlebars.compile(emailTemplate);
const html = template({ user, data });
```

### 3. Multi-language Support
```javascript
const templates = {
  en: require('./templates/en'),
  am: require('./templates/am') // Amharic
};

const html = templates[user.language || 'en'].registrationSubmitted(user);
```

### 4. SMS Notifications
Integrate Twilio or Africa's Talking for SMS:
```javascript
const twilioClient = require('twilio')(accountSid, authToken);

await twilioClient.messages.create({
  body: 'Your registration has been approved',
  from: '+251XXXXXXXXX',
  to: user.phone
});
```

---

## Files Modified

1. **coffee-export-gateway/src/services/notification.service.js** (NEW)
   - Email notification service
   - All email templates
   - SMTP configuration

2. **coffee-export-gateway/src/routes/auth.routes.js** (MODIFIED)
   - Added registration email notification
   - Imported notification service

3. **coffee-export-gateway/src/routes/ecta.routes.js** (MODIFIED)
   - Added approval email notification
   - Added rejection email notification
   - Added qualification approval notifications

4. **coffee-export-gateway/.env** (ALREADY CONFIGURED)
   - SMTP settings already present
   - Just need to update with real credentials

---

## Support

### Email Not Working?
1. Check SMTP credentials
2. Check gateway logs
3. Test SMTP connection manually
4. Verify firewall/network settings

### Need Help?
- Check logs: `docker logs coffee-gateway`
- Test SMTP: Use online SMTP tester
- Contact: support@ecta.gov.et

---

**Status**: ✅ Email Notification System Fully Implemented
**Date**: February 21, 2026
**Version**: 1.0
