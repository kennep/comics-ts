# Comics.ts

A comics aggregator that is meant to be run as a [CloudFlare Worker](https://workers.cloudflare.com/).

Based on the [Worker Typescript Template](https://github.com/cloudflare/worker-typescript-template). The documentation below is an edited version of what was included with the template.

## Note: You must use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) 4.x

## 🔋 Getting Started

This project is meant to be used with [Wrangler](https://github.com/cloudflare/wrangler). If you are not already familiar with the tool, we recommend that you install the tool and configure it to work with your [Cloudflare account](https://dash.cloudflare.com). Documentation can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler/).

### 👩 💻 Developing

[`src/index.ts`](./src/index.ts) is the entry point for the server-side functionality.

The client can be found at [`client/index.ts`](./client/index.ts), and the project is also set up to serve static assets under [`public`](./public).

### 👀 Previewing and Publishing

For information on how to preview and publish the worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

