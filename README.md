# CS2 News Notifier (Cloudflare Worker)

This Cloudflare Worker monitors the Counter-Strike 2 Steam news feed and sends a notification to a Discord Webhook whenever a new update is posted.

## Setup Instructions

### 1. Requirements
- A [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed locally
- A Discord server with a Webhook URL

### 2. Create KV Namespace
You need a KV namespace to store the ID of the last processed news item.
```bash
npx wrangler kv:namespace create NEWS_STORAGE
```
Copy the `id` from the output and paste it into `wrangler.toml` under `[[kv_namespaces]]`.

### 3. Set Discord Webhook Secret
Run this command to securely add your Discord Webhook URL:
```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
```
When prompted, paste your Discord Webhook URL.

### 4. Deploy
Deploy the worker to Cloudflare:
```bash
npx wrangler deploy
```

### 5. Testing
Once deployed, you can visit `https://cs2-news-notifier.<your-subdomain>.workers.dev/test` to manually trigger a check.

## How it works
- **Triggers**: It runs automatically every 15 minutes (configurable in `wrangler.toml`).
- **Data Source**: Uses the Steam Web API (`ISteamNews/GetNewsForApp/v2`).
- **Persistence**: Remembers the last update using Cloudflare KV to avoid duplicate notifications.
