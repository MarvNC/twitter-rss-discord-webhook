# Twitter to Discord Webhook

This script posts Twitter feeds to a Discord webhook via a Nitter RSS feed. Notably, this script supports translation of the tweets using DeepL and replaces the tweet links with [fxtwitter/FixTweet](https://github.com/FixTweet/FixTweet) for better Discord embeds. Note that Nitter RSS is not supported by every instance of Nitter - you can view a list of supported instances [here](https://status.d420.de/).

## Usage

- Clone this repo
- Create a `settings.json` file based on `settings.example.json` with your settings. You can simply copy the example file and rename it.
- Install dependencies: `pnpm install`
- Run the script: `npm start`

> [!IMPORTANT]
> This script only works on Node versions 18 and above.

## Settings

The `settings.json` file contains the following configuration:

```json
{
  "settings": {
    "interval_minutes": "5",
    "seconds_between_feeds": "15",
    "deepl_api_key": "apikey"
  },
  "feeds": [
    {
      "rss": "https://nitter.poast.org/Reuters/rss",
      "webhook": "https://discord.com/api/webhooks/asdfg",
      "translate": "en"
    }
  ]
}
```

### Settings

- `interval_minutes` - How often to check feeds, in minutes. Default is 5.
- `seconds_between_feeds` - How long to wait between checking each feed, in seconds. Default is 15. This is to prevent rate limiting.
- `deepl_api_key` - API key for DeepL translation. Get one for free at https://www.deepl.com/pro-api/.

### Feeds

The `feeds` array contains objects with the following properties:

- `rss` - The Nitter RSS feed URL to check.
- `webhook` - The Discord webhook URL to post to.
- `translate` - (Optional) Language code to translate the post to before sending. Uses DeepL translation.

Any number of feeds can be added to the array.
