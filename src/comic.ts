import { CheerioAPI, load } from 'cheerio'
import xss, { whiteList } from 'xss'

export type Comic = {
  name: string
  linkUrl: string
  data: ComicData
  updated: number
}

export type ComicMedia = {
  id?: string,
  href?: string,
  content?: string,
  type: string
}

export type ComicData = {
  media: ComicMedia[]
  errors?: string[]
}


export function age(comic: Comic): number
{
  return new Date().getTime() - comic.updated
}

export function hasErrors(comic: Comic): boolean
{
  return comic.data.errors != null && comic.data.errors.length > 0
}

function fixUrl(originUrl: string, url?: string): string | undefined {
  if (!url) return url

  const parsedOrigin = new URL(originUrl)
  if (url.startsWith('//')) {
    url = parsedOrigin.protocol + url
  }

  return new URL(url, originUrl).href
}

function fixupHtml(originUrl: string, html?: string): string | undefined {
  if (!html) return html;

  const $ = load(sanitize(html), {xmlMode: false}, false)
  $('img').attr('src', (_, src) => fixUrl(originUrl, src) as string);
  $('img[srcset]').attr('srcset', (_, srcset) => fixSrcSet(originUrl, srcset));

  return $.html();
}

function sanitize(html: string): string {
  return xss(html, {
    allowList: {
      ...whiteList,
      img: ["src", "srcset", "alt", "title", "width", "height"]
    }
  })
}

function fixSrcSet(originUrl: string, srcSet: string): string {
  return srcSet.split(",").map(sc => {
    const urlAndSizes = sc.split(" ").filter(s => s);
    urlAndSizes[0] = fixUrl(originUrl, urlAndSizes[0]) as string;
    return urlAndSizes.join(" ");
  }).join(",");
}

function fixup(originUrl: string, cd: ComicData): ComicData {
  return {
    errors: cd.errors,
    media: cd.media.map(m => {
      return {
        ...m,
        href: fixUrl(originUrl, m.href),
        content: m.type == 'html' ? fixupHtml(originUrl, m.content) : m.content
      }
    })
  }
}

function validate(comicData: ComicData) {
  if(!comicData.media)
  {
    comicData.media = []
  }

  comicData.media = comicData.media.filter(m => (m.href || m.content || m.id))
  
  if (!comicData.errors) {
    comicData.errors = []
  }
  if (comicData.media.length == 0) {
    comicData.errors.push('Could not load comic')
  }
}

export abstract class ComicDefinition {
  name: string
  linkUrl: string

  constructor(name: string, linkUrl: string) {
    this.name = name
    this.linkUrl = linkUrl
  }

  abstract loadComicData(linkUrl: string): Promise<ComicData>

  async getComic(): Promise<Comic> {
    try {
      const comicData = await this.loadComicData(this.linkUrl)
      validate(comicData)
      return {
        name: this.name,
        linkUrl: this.linkUrl,
        data: fixup(this.linkUrl, comicData),
        updated: new Date().getTime()
      }
    } catch (e: any) {
      return {
        name: this.name,
        linkUrl: this.linkUrl,
        data: {
          media: [],
          errors: [e.toString()],
        },
        updated: new Date().getTime()
      }
    }
  }
}

export type DirectUrlImageFactory = (linkUrl: string) => string

export class DirectUrlComic extends ComicDefinition {
  imgFactory: DirectUrlImageFactory

  constructor(
    name: string,
    linkUrl: string,
    imgFactory: DirectUrlImageFactory,
  ) {
    super(name, linkUrl)
    this.imgFactory = imgFactory
  }

  loadComicData(linkUrl: string): Promise<ComicData> {
    return Promise.resolve({
      media: [{
        href: this.imgFactory(linkUrl),
        type: 'image'
      }]
    })
  }
}

export type UrlLoaderFactory = (body: string) => ComicData

export class LoadedUrlComic extends ComicDefinition {
  comicFactory: UrlLoaderFactory

  constructor(name: string, url: string, comicFactory: UrlLoaderFactory) {
    super(name, url)
    this.comicFactory = comicFactory
  }

  async loadComicData(linkUrl: string): Promise<ComicData> {
    const response = await this.fetchWithTimeout(linkUrl)

    const body = await response.text()
    if (response.status != 200) {
      throw new Error(`Failed getting ${this.name}: HTTP ${response.status}: ${body}`)
    }

    return this.comicFactory(body)
  }
  
  async fetchWithTimeout(input: RequestInfo, init?: RequestInit): Promise<Response>
  {
    const timeout = 2000;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal  
      });  
      return response;
    }
    finally {
      clearTimeout(id);
    }
  }
}

export type ParseComicFactory = (body: CheerioAPI, bodyText: string) => ComicData

export class ParseComic extends LoadedUrlComic {
  constructor(name: string, url: string, comicFactory: ParseComicFactory) {
    super(name, url, (body) => {
      const doc = load(body, {xmlMode: false, scriptingEnabled: false})
      return comicFactory(doc, body)
    })
  }
}

export class NavigateParseComic extends ParseComic {
  targetSelector: (body: CheerioAPI) => string;

  constructor(name: string, url: string, targetSelector: (body: CheerioAPI) => string, comicFactory: ParseComicFactory) {
    super(name, url, comicFactory);
    this.targetSelector = targetSelector;
  }

  async loadComicData(linkUrl: string): Promise<ComicData> {
    const response = await this.fetchWithTimeout(linkUrl);

    const body = await response.text()
    if (response.status != 200) {
      throw new Error(`Failed getting ${this.name}: HTTP ${response.status}: ${body}`)
    }
    const doc = load(body, {xmlMode: false, scriptingEnabled: false});
    const targetUrl = this.targetSelector(doc);
    if(!targetUrl) {
      throw new Error("Unable to find target URL; url=" + this.linkUrl + " src=" + body);
    }

    const navigatedUrl = fixUrl(linkUrl, targetUrl)!;

    return await super.loadComicData(navigatedUrl);
  }
}


export function singleImage(href: string | undefined):  ComicData {
  return {
    media: [{type: 'image', href: href}]
  };
}

export function singleImageWithTitle(href: string | undefined, title: string | undefined):  ComicData {
  return {
    media: [{type: 'image', href: href}, {type: 'text', content: title}]
  };
}

// These functions are internal, and are only exported for unit testing
export const exportedForTesting = {
  fixSrcSet: fixSrcSet,
  fixup: fixup,
  fixupHtml: fixupHtml
}
