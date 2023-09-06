const axios = require('axios');
const rss = require('rss-parser');
const { settings, feeds } = require('./settings.json');

const parser = new rss();

let lastUpdated = new Date();

setInterval(() => {
  // Get the current time
  const currentTime = new Date();
  // Check if the current time is past the last updated time + the interval
  if (currentTime.getTime() > lastUpdated.getTime() + settings.interval_minutes * 60 * 1000) {
    checkAllFeeds();
    // Update the last updated time
    lastUpdated = currentTime;
  }
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
    // iterate through feed items from oldest to newest
    for (const item of parsed.items.reverse()) {
      // Check if the item is newer than the last updated time
      if (new Date(item.pubDate) > lastUpdated) {
        // Send the message
        await sendMessage(item, feed);
      }
    }
    
    // const messageString = await buildMessageFromFeed(parsed, feed);
    // // Send the message
    // axios
    //   .post(feed.webhook, {
    //     content: messageString,
    //   })
    //   .then(() => {
    //     console.log(`Sent ${title} to ${feed.webhook}`);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  });
}

function sendMessageToWebhook(message, webhook) {
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
  for (const feed of feeds) {
    handleFeed(feed);
  }
}

async function buildMessageFromFeed(feedItem, feed) {
  let messageString = '';
  // Get the title and link
  const title = feedItem.title;
  const creator = feedItem.creator;
  const link = feedItem.link;
  messageString += title + '\n';

  // replace link with fxtwitter
  const fxTwitterLink = new URL(link);
  fxTwitterLink.hostname = 'fxtwitter.com';
  fxTwitterLink.hash = '';
  messageString += fxTwitterLink + '\n';

  // add translation if needed
  if (feed.translate) {
    // get translation from deepl free
    const translation = await translate(feedItem.contentSnippet, feed.translate);
    if (translation) messageString += `\`\`\`${translation}\`\`\`\n`;
  }
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
