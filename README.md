# Comics.ts

A comics aggregator that is meant to be run as a [CloudFlare Worker](https://workers.cloudflare.com/).

Based on the [Worker Typescript Template](https://github.com/cloudflare/worker-typescript-template). The documentation below is an edited version of what was included
with the template.

## Note: You must use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update) 3.x

## 🔋 Getting Started

This project is meant to be used with [Wrangler](https://github.com/cloudflare/wrangler). If you are not already familiar with the tool, we recommend that you install the tool and configure it to work with your [Cloudflare account](https://dash.cloudflare.com). Documentation can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler/).

### 👩 💻 Developing

[`src/index.ts`](./src/index.ts) calls the request handler in [`src/handler.ts`](./src/handler.ts), and will return the [request method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) for the given request.

The client can be found at [`client/index.ts`](./client/index.ts), and the project is also set up to serve static assets under [`public`](./public).

### 🧪 Testing

`npm test` will run the tests tests.

### ✏️ Formatting

This project uses [`prettier`](https://prettier.io/) to format the project. To invoke, run `npm run format`.

### 👀 Previewing and Publishing

For information on how to preview and publish the worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

## ⚠️ Caveats

The `service-worker-mock` used by the tests is not a perfect representation of the Cloudflare Workers runtime. It is a general approximation. We recommend that you test end to end with `wrangler dev` in addition to a [staging environment](https://developers.cloudflare.com/workers/tooling/wrangler/configuration/environments/) to test things before deploying.
