const axios = require('axios');
const rss = require('rss-parser');
const { settings, feeds } = require('./settings.json');

const parser = new rss();

let lastUpdated = new Date();
let latestCheckedFeedItemDate = lastUpdated;
const DEBUG = false;
if (DEBUG) {
  console.log('DEBUG MODE');
  // move lastUpdated back
  // lastUpdated = new Date(lastUpdated.getTime() - 20 * 60 * 1000);
  latestCheckedFeedItemDate = lastUpdated;
  settings.interval_minutes = 0.5;
}

setInterval(() => {
  checkAllFeeds();
  // Update the last updated time
  lastUpdated = latestCheckedFeedItemDate;
}, 60 * 1000 * settings.interval_minutes);
checkAllFeeds();

// Reads a feed and sends a message to the webhook
function handleFeed(feed) {
  // Get the feed
  const url = feed.rss;
  // Fetch the feed
  parser.parseURL(url, async (err, parsed) => {
    if (err) {
      console.error(err);
      return;
    }
    // Iterate through feed items from oldest to newest
    for (const item of parsed.items.reverse()) {
      const itemDate = new Date(item.pubDate);
      // console.log(`Checking ${item.title} from ${itemDate} against ${lastUpdated}...`);
      // Check if the item is newer than the last updated time
      if (itemDate > lastUpdated) {
        handleFeedItem(item, feed);
        latestCheckedFeedItemDate = Math.max(latestCheckedFeedItemDate, itemDate);
      }
    }
  });
}

function sendMessageToWebhook(message = '', webhook) {
  axios
    .post(webhook, {
      content: message,
    })
    .then(() => {
      console.log(`Sent ${message} to ${webhook}`);
    })
    .catch((err) => {
      console.error(err);
    });
}

function checkAllFeeds() {
  console.log(
    `Checking feeds at ${new Date()}; last updated at ${lastUpdated} and latest checked feed item date at ${latestCheckedFeedItemDate}...`
  );
  for (const feed of feeds) {
    handleFeed(feed);
  }
}

// Reads and sends a message for a feed item
async function handleFeedItem(feedItem, feed) {
  const message = await buildMessageFromFeed(feedItem, feed);
  sendMessageToWebhook(message, feed.webhook);
}

async function buildMessageFromFeed(feedItem, feed) {
  let messageString = '';
  // Get the title and link
  const title = feedItem.title;
  const creator = feedItem.creator;
  const link = feedItem.link;
  const itemDate = new Date(feedItem.pubDate);

  // replace link with fxtwitter
  const fxTwitterLink = new URL(link);
  fxTwitterLink.hostname = 'fxtwitter.com';
  fxTwitterLink.hash = '';

  // Build the message
  messageString += `${creator} posted on <t:${itemDate.valueOf() / 1000}>\n`;
  messageString += title + '\n';
  messageString += fxTwitterLink + '\n';

  // add translation if needed
  if (feed.translate) {
    // get translation from deepl free
    const translation = await translate(feedItem.contentSnippet, feed.translate);
    if (translation) messageString += `\`\`\`${translation}\`\`\`\n`;
  }
  return messageString;
}

// Translate a string and return the translation
async function translate(text, lang) {
  var myHeaders = new Headers();
  myHeaders.append('Authorization', `DeepL-Auth-Key ${settings.deepl_api_key}`);
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

  var urlencoded = new URLSearchParams();
  urlencoded.append('text', text);
  urlencoded.append('target_lang', lang);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  };

  // fetch and return response text
  const response = await fetch('https://api-free.deepl.com/v2/translate', requestOptions);
  const result = await response.text();
  const json = JSON.parse(result);
  if (json.translations[0].detected_source_language.toLowerCase() === lang.toLowerCase()) {
    return null;
  }
  return json.translations[0].text;
}
