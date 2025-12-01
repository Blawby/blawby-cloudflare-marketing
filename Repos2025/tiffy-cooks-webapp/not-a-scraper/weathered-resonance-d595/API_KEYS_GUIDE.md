# API Key Management System

Your Lawyer Search API now includes a comprehensive API key management system that allows you to:

- Create and manage API keys for different users
- Track daily quota usage per user
- Authenticate API requests
- Monitor usage patterns

## 🔑 API Key Endpoints

### 1. Create API Key (Admin Only)
```bash
curl -X POST "https://search.blawby.com/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "userId": "user-123",
    "name": "My API Key",
    "quotaPerDay": 100
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "My API Key",
  "key": "abc123def456...", // Only shown on creation!
  "quota_per_day": 100,
  "created_at": "2025-09-24T08:37:58.847Z",
  "is_active": true
}
```

### 2. List Your API Keys
```bash
curl -X GET "https://search.blawby.com/api-keys" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Check Your Quota Usage
```bash
curl -X GET "https://search.blawby.com/user-quota" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 4. Deactivate an API Key
```bash
curl -X POST "https://search.blawby.com/api-keys/deactivate?keyId=1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 5. Check Global Quota Status (Admin Only)
```bash
curl -X GET "https://search.blawby.com/global-quota" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

## 🔍 Using API Keys with Search

### API Key Required (No Public Access)
```bash
curl "https://search.blawby.com/lawyers?state=NC" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Note**: All requests require an API key. No public access is available.

## 📊 Quota Management

- **Free Tier**: 3 requests per day per API key
- **Maximum User Quota**: 50 requests per day per API key
- **Owner Quota**: 100 requests per day (special access)
- **Total System Quota**: 20 requests per day for all regular users combined
- **Quota Tracking**: Automatically tracks usage per user per day
- **Quota Exceeded**: Returns 401 with "Daily quota exceeded" message
- **Quota Reset**: Automatically resets at midnight UTC
- **Global Protection**: System prevents creating API keys that would exceed total quota

## 🛡️ Security Features

- **Secure Key Generation**: 32-character random strings
- **Hashed Storage**: API keys are hashed with SHA-256 before storage
- **Admin Protection**: Only admin users can create new API keys
- **User Isolation**: Users can only see and manage their own API keys
- **Automatic Cleanup**: Inactive keys can be deactivated

## 🚀 Getting Started

1. **Set Admin Secret**: Use `wrangler secret put CRAWL_SECRET` to set your admin password
2. **Create API Key**: Use the admin endpoint to create your first API key
3. **Store Securely**: Save the API key securely - it's only shown once!
4. **Start Using**: Include the API key in your requests with `Authorization: Bearer YOUR_KEY`

## 💰 Future Freemium Model

- **Free Tier**: 3 requests per day (perfect for testing)
- **Paid Tiers**: Higher quotas available for registered users
- **Owner Access**: Special high-quota access for blawby.com

## 📈 Monitoring

- Check your quota usage anytime with `/user-quota`
- View all your API keys with `/api-keys`
- Monitor system-wide stats with `/stats` (admin only)
- Check global quota allocation with `/global-quota` (admin only)

## 🔧 Configuration

- **Quota Limits**: Set custom daily limits when creating API keys
- **User Management**: Each API key is tied to a specific user ID
- **Key Naming**: Give descriptive names to your API keys for easy management

---

**Note**: The `/lawyers` endpoint requires an API key for all requests. This ensures proper quota management and prepares for the future freemium model.
