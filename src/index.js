export default {
  async fetch(request, env, ctx) {
    // Manual trigger for testing
    const url = new URL(request.url);
    if (url.pathname === "/test") {
      await this.scheduled(null, env, ctx);
      return new Response("Check triggered manually!", { status: 200 });
    }
    return new Response("CS2 News Notifier is running. Use /test to trigger check manually.", { status: 200 });
  },

  async scheduled(event, env, ctx) {
    const APP_ID = '730';
    const STEAM_API_URL = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${APP_ID}&count=1&maxlength=500`;

    console.log("Checking for CS2 updates...");

    try {
      const response = await fetch(STEAM_API_URL);
      if (!response.ok) {
        throw new Error(`Steam API returned ${response.status}`);
      }
      
      const data = await response.json();
      const latestItem = data.appnews.newsitems[0];

      if (!latestItem) {
        console.log("No news items found.");
        return;
      }

      const lastGid = await env.NEWS_STORAGE.get('last_gid');
      console.log(`Latest GID: ${latestItem.gid}, Cached GID: ${lastGid}`);

      if (latestItem.gid !== lastGid) {
        console.log("New update detected! Sending notification...");
        await notifyDiscord(latestItem, env.DISCORD_WEBHOOK_URL);
        await env.NEWS_STORAGE.put('last_gid', latestItem.gid);
      } else {
        console.log("No new updates.");
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
};

async function notifyDiscord(item, webhookUrl) {
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not set!");
    return;
  }

  // Steam news content can contain BBCode or be very long/messy
  // Simple cleaning for Discord
  const cleanContent = item.contents
    .replace(/\[img\].*?\[\/img\]/g, '') // Remove images
    .replace(/\[.*?\]/g, '') // Remove other tags
    .substring(0, 500) + (item.contents.length > 500 ? '...' : '');

  const payload = {
    content: "🚀 **New CS2 Update!**",
    embeds: [{
      title: item.title,
      url: item.url,
      description: cleanContent,
      color: 5814783, // Steam Blue
      timestamp: new Date(item.date * 1000).toISOString(),
      footer: {
        text: `Author: ${item.author} • Feed: ${item.feedlabel}`
      }
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(`Discord Webhook failed with status ${response.status}`);
  }
}
