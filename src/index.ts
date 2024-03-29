import { handleComicsRequest, handleComicRequest } from './comics_endpoint'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', (evt) => {
  const event = evt as FetchEvent
  const pathname = new URL(event.request.url).pathname
  if (pathname == '/comics') {
    event.respondWith(handleComicsRequest(event.request))
  } else if(pathname.startsWith("/comics/")) {
    const comicName = decodeURIComponent(pathname.substring("/comics/".length))
    event.respondWith(handleComicRequest(event.request, comicName))
  } else {
    event.respondWith(handleStatic(event))
  }
})

async function handleStatic(event: any) {
  try {
    return await getAssetFromKV(event)
  } catch (e) {
    const pathname = new URL(event.request.url).pathname
    return new Response(`"${pathname}" not found`, {
      status: 404,
      statusText: 'not found',
    })
  }
}
