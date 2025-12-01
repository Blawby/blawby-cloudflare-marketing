# Lawyer Crawler & API

A Cloudflare Worker that automatically crawls Google Custom Search for lawyers across US cities, stores the data in D1 database, and provides a REST API for querying the collected data.

## Features

- **Daily Automated Crawling**: Runs at 3AM UTC daily, rotating through 100+ US cities
- **Quota Management**: Respects Google's 100 queries/day limit using KV storage
- **Database Storage**: Stores lawyer data in Cloudflare D1 with proper indexing
- **REST API**: Query lawyers by city, state, with pagination
- **Manual Crawl Trigger**: Authenticated endpoint for on-demand crawling
- **Duplicate Prevention**: Automatically handles duplicate URLs

## Setup Instructions

### 1. Create Required Resources

```bash
# Create D1 database
wrangler d1 create lawyers-db

# Create KV namespace
wrangler kv:namespace create "QUOTA_KV"
wrangler kv:namespace create "QUOTA_KV" --preview
```

### 2. Update wrangler.jsonc

Replace the placeholder IDs in `wrangler.jsonc` with your actual resource IDs:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "QUOTA_KV",
      "id": "your-actual-kv-namespace-id",
      "preview_id": "your-actual-preview-kv-namespace-id"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "lawyers-db",
      "database_id": "your-actual-d1-database-id"
    }
  ]
}
```

### 3. Run Database Migration

```bash
# Apply the migration to create the lawyers table
wrangler d1 migrations apply lawyers-db
```

### 4. Set Secrets

```bash
# Set your Google API key
wrangler secret put GOOGLE_API_KEY

# Set crawl authentication secret (optional, for manual crawl endpoint)
wrangler secret put CRAWL_SECRET
```

### 5. Deploy

```bash
wrangler deploy
```

## Security Model

### Public Endpoints (No Authentication Required)
- **`GET /lawyers`** - Search lawyers database with optional Google fallback
- **`GET /health`** - Health check endpoint

### Private Endpoints (Require CRAWL_SECRET)
- **`POST /crawl`** - Manual crawl trigger
- **`GET /stats`** - Database statistics and monitoring
- **`GET /quota`** - Quota usage information

### Authentication
Private endpoints require the `Authorization: Bearer <CRAWL_SECRET>` header. Set your secret using:
```bash
wrangler secret put CRAWL_SECRET
```

## API Endpoints

### GET /lawyers
Retrieve paginated list of lawyers with optional filtering and sorting.

**Query Parameters:**
- `city` (optional): Filter by city name
- `state` (optional): Filter by state abbreviation
- `practice_area` (optional): Filter by practice area (e.g., "family lawyer", "criminal defense lawyer")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)
- `sort` (optional): Sort field and direction (default: created_at:desc)
  - Format: `field:direction` (e.g., `name:asc`, `created_at:desc`)
  - Valid fields: `id`, `name`, `firm`, `city`, `state`, `practice_area`, `created_at`, `updated_at`
  - Valid directions: `asc`, `desc`

**Example:**
```
GET /lawyers?city=Chattanooga&state=TN&practice_area=family+lawyer&page=1&limit=10&sort=name:asc
```

**Response:**
```json
{
  "lawyers": [
    {
      "id": 1,
      "name": "John Smith",
      "firm": "Smith & Associates",
      "url": "https://example.com",
      "snippet": "Family law attorney...",
      "city": "Chattanooga",
      "state": "TN",
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST /crawl
Manually trigger crawling for a specific city (requires authentication).

**Headers:**
- `Authorization: Bearer <your-crawl-secret>`

**Query Parameters:**
- `city`: City name to crawl
- `state`: State abbreviation

**Example:**
```
POST /crawl?city=Atlanta&state=GA
Authorization: Bearer your-secret-token
```

**Response:**
```json
{
  "message": "Successfully crawled Atlanta, GA",
  "results": [
    {
      "name": "Jane Doe",
      "firm": "Doe Law Firm",
      "url": "https://example.com",
      "snippet": "Family law services...",
      "city": "Atlanta",
      "state": "GA"
    }
  ]
}
```

### GET /quota
Check daily Google API quota usage (requires authentication).

**Headers:**
- `Authorization: Bearer <your-crawl-secret>`

**Response:**
```json
{
  "date": "2025-01-27",
  "crawl": {
    "used": 6,
    "limit": 8,
    "remaining": 2,
    "percentage": 75
  },
  "search": {
    "used": 1,
    "limit": 2,
    "remaining": 1,
    "percentage": 50
  },
  "total": {
    "used": 7,
    "limit": 10,
    "remaining": 3,
    "percentage": 70
  }
}
```

### GET /stats
Get database statistics (requires authentication).

**Headers:**
- `Authorization: Bearer <your-crawl-secret>`

**Response:**
```json
{
  "total_lawyers": 1250,
  "distinct_cities": 45,
  "distinct_states": 12,
  "distinct_practice_areas": 7,
  "last_crawl": "2025-01-27T03:00:00Z",
  "today_quota_used": 8,
  "quota_limit": 10,
  "quota_remaining": 2,
  "today_lawyers_added": 95,
  "crawl_progress": {
    "currentCity": "Dallas",
    "currentState": "TX",
    "currentPracticeArea": "criminal defense lawyer",
    "currentPage": 3,
    "totalStates": 50,
    "totalCities": 50000,
    "totalPracticeAreas": 20,
    "totalPages": 10,
    "progressPercentage": 2
  },
  "top_cities": [
    {
      "city": "Chattanooga",
      "state": "TN",
      "count": 25
    }
  ]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:00:00Z"
}
```

## Database Schema

The `lawyers` table includes:

- `id`: Auto-incrementing primary key
- `name`: Lawyer/firm name
- `firm`: Law firm name (if extractable)
- `url`: Unique website URL
- `snippet`: Google search snippet
- `city`: City name
- `state`: State abbreviation
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

## Daily Crawling

The system automatically crawls one city per day at 3AM UTC, rotating through the predefined list of 100+ US cities. Each day uses a different city based on the day of the year, ensuring comprehensive coverage over time.

## Quota Management

- Tracks daily Google API usage in KV storage
- Automatically blocks requests when 100 queries/day limit is reached
- Quota resets daily at midnight UTC
- Uses TTL-based expiration for automatic cleanup

## Error Handling

- Comprehensive error handling for API failures
- Graceful handling of quota exceeded scenarios
- Database error recovery
- Detailed logging for debugging

## Development

```bash
# Start local development server
wrangler dev

# Run tests
npm test

# Deploy to production
wrangler deploy
```

## Monitoring

Check the Cloudflare Workers dashboard for:
- Cron job execution logs
- API request metrics
- Error rates and debugging information
- KV and D1 usage statistics
