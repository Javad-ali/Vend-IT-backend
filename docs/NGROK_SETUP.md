# Ngrok Setup Guide

Complete guide to exposing your Vend-IT backend to the internet using ngrok.

---

## 🎯 Why Use Ngrok?

- **Webhook Testing** - Receive webhooks from payment providers (Tap, Stripe, etc.)
- **Mobile App Testing** - Connect your mobile app to local backend
- **API Sharing** - Share your API with team members or clients
- **External Service Integration** - Test services that need public URLs

---

## 📦 Installation

### Option 1: Official Ngrok

1. **Download Ngrok**
   ```bash
   # macOS (Homebrew)
   brew install ngrok/ngrok/ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Sign Up & Get Auth Token**
   - Sign up at https://dashboard.ngrok.com/signup
   - Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configure Auth Token**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### Option 2: Using npm (Alternative)

```bash
npm install -g ngrok
```

---

## 🚀 Quick Start

### 1. Start Your Backend
```bash
npm run dev
# Backend running on http://localhost:3000
```

### 2. Start Ngrok (New Terminal)
```bash
# Basic usage
ngrok http 3000

# With subdomain (paid plan)
ngrok http 3000 --subdomain=vendit-dev

# With custom domain (paid plan)
ngrok http 3000 --hostname=api.yourdomain.com
```

### 3. Get Your Public URL
Ngrok will display:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Your API is now accessible at: `https://abc123.ngrok-free.app`

---

## 📝 Configuration File

Create `ngrok.yml` in project root for persistent configuration:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN_HERE

tunnels:
  vendit-api:
    proto: http
    addr: 3000
    inspect: true
    schemes:
      - https
    # Optional: custom subdomain (paid plan)
    # subdomain: vendit-dev
    
  vendit-ws:
    proto: http
    addr: 3000
    inspect: true
    # For WebSocket support

region: us  # or: eu, ap, au, sa, jp, in
```

### Using Config File
```bash
# Start specific tunnel
ngrok start vendit-api

# Start all tunnels
ngrok start --all
```

---

## 🔧 NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "ngrok": "ngrok http 3000",
    "dev:public": "concurrently \"npm run dev\" \"npm run ngrok\"",
    "ngrok:config": "ngrok start vendit-api"
  }
}
```

Then run:
```bash
# Option 1: Manual
npm run dev        # Terminal 1
npm run ngrok      # Terminal 2

# Option 2: Concurrent (requires 'concurrently' package)
npm install -D concurrently
npm run dev:public
```

---

## 🔐 Security Best Practices

### 1. Enable Basic Auth (Free Plan)
```bash
ngrok http 3000 --basic-auth="username:password"
```

### 2. IP Restrictions (Paid Plan)
```yaml
# In ngrok.yml
tunnels:
  vendit-api:
    proto: http
    addr: 3000
    ip_restriction:
      allow_cidrs:
        - 1.2.3.4/32
        - 5.6.7.8/24
```

### 3. OAuth Protection (Paid Plan)
```yaml
tunnels:
  vendit-api:
    proto: http
    addr: 3000
    oauth:
      provider: google
      allow_emails:
        - yourteam@company.com
```

### 4. Use Environment Variables
```bash
# .env
NGROK_AUTH_TOKEN=your_token_here
NGROK_DOMAIN=your-subdomain  # if you have paid plan
```

---

## 📱 Common Use Cases

### 1. Testing Payment Webhooks

**Tap Payments Example:**
```bash
# Start ngrok
ngrok http 3000

# Use the URL in Tap dashboard
Webhook URL: https://abc123.ngrok-free.app/api/webhooks/tap
```

**Update `.env` for testing:**
```bash
# Add ngrok URL
PUBLIC_API_URL=https://abc123.ngrok-free.app
```

### 2. Mobile App Development

Update your mobile app config:
```javascript
// In your mobile app
const API_URL = 'https://abc123.ngrok-free.app';
```

### 3. Third-Party Service Integration

Share ngrok URL with external services:
```
API Base URL: https://abc123.ngrok-free.app/api
Health Check: https://abc123.ngrok-free.app/api/health
```

---

## 🛠️ Advanced Configuration

### Custom Headers
```bash
ngrok http 3000 \
  --request-header-add="X-Custom-Header: value" \
  --response-header-add="Access-Control-Allow-Origin: *"
```

### WebSocket Support
```bash
# Ngrok automatically supports WebSockets
ngrok http 3000

# Your WebSocket endpoint
wss://abc123.ngrok-free.app/ws
```

### Multiple Ports
```yaml
# ngrok.yml
tunnels:
  api:
    proto: http
    addr: 3000
  admin:
    proto: http
    addr: 3001
```

### Request Inspection
Access ngrok inspector at: `http://localhost:4040`

- View all HTTP requests/responses
- Replay requests
- Debug webhook payloads

---

## 📊 Monitoring & Debugging

### 1. View Live Traffic
```bash
# Open web interface
open http://localhost:4040
```

### 2. Request Logs
All requests are logged in the ngrok dashboard and web interface.

### 3. Save Requests for Debugging
```bash
# In web interface (localhost:4040)
# Click any request → Replay
# Copy as cURL, Postman, etc.
```

---

## 🚨 Troubleshooting

### Issue: "Tunnel not found"
**Solution:** Check your authtoken is configured
```bash
ngrok config check
```

### Issue: "Failed to start tunnel"
**Solution:** Port already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Or use different port
ngrok http 3001
```

### Issue: "Too many connections" (Free Plan)
**Solution:** Free plan limited to 1 tunnel
- Stop other ngrok processes
- Or upgrade to paid plan

### Issue: Connection reset / 502 errors
**Solution:** 
- Ensure your backend is running
- Check backend logs for errors
- Verify port number matches

---

## 💰 Pricing & Plans

### Free Plan
- ✅ Random URLs
- ✅ 1 online ngrok process
- ✅ 4 tunnels/ngrok process
- ✅ 40 connections/minute
- ❌ No custom domains
- ❌ No reserved subdomains

### Personal ($8/month)
- ✅ Custom subdomains
- ✅ Reserved domains
- ✅ More connections
- ✅ IP whitelisting

### Pro ($20/month)
- ✅ Everything in Personal
- ✅ Custom domains
- ✅ IP restrictions
- ✅ OAuth
- ✅ More concurrent tunnels

---

## 📋 Checklist for Production Testing

- [ ] Install ngrok
- [ ] Configure authtoken
- [ ] Create ngrok.yml config
- [ ] Add npm scripts
- [ ] Test basic tunnel connection
- [ ] Verify API health check works
- [ ] Test webhook endpoints
- [ ] Configure security (basic auth)
- [ ] Update mobile app config
- [ ] Test payment provider webhooks
- [ ] Monitor requests in web interface
- [ ] Document public URL for team

---

## 🔗 Useful Links

- **Ngrok Dashboard**: https://dashboard.ngrok.com
- **Documentation**: https://ngrok.com/docs
- **Web Interface**: http://localhost:4040
- **Download**: https://ngrok.com/download
- **Pricing**: https://ngrok.com/pricing

---

## 💡 Quick Reference

```bash
# Start basic tunnel
ngrok http 3000

# With auth
ngrok http 3000 --basic-auth="user:pass"

# With subdomain (paid)
ngrok http 3000 --subdomain=vendit

# Using config
ngrok start vendit-api

# Check status
curl http://localhost:4040/api/tunnels

# View logs
ngrok http 3000 --log=stdout
```

---

## 🎯 Next Steps

1. Install ngrok: `brew install ngrok/ngrok/ngrok`
2. Get auth token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure: `ngrok config add-authtoken YOUR_TOKEN`
4. Create `ngrok.yml` in project root
5. Add npm scripts to `package.json`
6. Start testing: `npm run ngrok`

Happy tunneling! 🚀
