import { LoadedUrlComic, ParseComic } from '../src/comic'
import { comicDefinitions } from '../src/comics'

describe('SMBC HTTP status workaround', () => {
  const smbc = comicDefinitions.find(comic => comic.name === 'SMBC') as ParseComic
  const html = '<img id="cc-comic" src="/comic.png" title="Caption"><div id="aftercomic"><img src="/extra.png"></div>'

  afterEach(() => jest.restoreAllMocks())

  test.each([200, 500])('loads valid comic HTML with HTTP %i', async status => {
    jest.spyOn(smbc, 'fetchWithTimeout').mockResolvedValue(new Response(html, { status }))

    const comic = await smbc.getComic()

    expect(comic.data.errors).toEqual([])
    expect(comic.data.media).toEqual([
      { type: 'image', href: 'https://www.smbc-comics.com/comic.png' },
      { type: 'image', href: 'https://www.smbc-comics.com/extra.png' },
      { type: 'text', content: 'Caption', href: undefined }
    ])
  })

  test('reports missing media in an HTTP 500 error page', async () => {
    jest.spyOn(smbc, 'fetchWithTimeout').mockResolvedValue(new Response('Internal Server Error', { status: 500 }))

    const comic = await smbc.getComic()

    expect(comic.data.media).toEqual([])
    expect(comic.data.errors).toEqual(['Could not load comic'])
  })

  test('still rejects other HTTP errors for SMBC', async () => {
    jest.spyOn(smbc, 'fetchWithTimeout').mockResolvedValue(new Response(html, { status: 403 }))
    await expect(smbc.loadComicData(smbc.linkUrl)).rejects.toThrow('HTTP 403')
  })

  test('still rejects HTTP 500 for other comics', async () => {
    const comic = new LoadedUrlComic('Other', 'https://example.com/', () => ({ media: [] }))
    jest.spyOn(comic, 'fetchWithTimeout').mockResolvedValue(new Response(html, { status: 500 }))
    await expect(comic.loadComicData(comic.linkUrl)).rejects.toThrow('HTTP 500')
  })
})
