import { comicDefinitions } from './comics'
import { Comic, age, hasErrors } from './comic'

const comicKvKey = "comics.json"

const SECOND=1000
const MINUTE=60*SECOND
const HOUR=60*MINUTE

type Comics = {[key:string]: Comic}

export async function handleComicsRequest(request: Request, comicsKV: KVNamespace): Promise<Response> {
  const comics = await getAndUpdateComics(comicsKv, c => isUpToDate(c, 12, 0))
  let comicsArray: Array<Comic> = Array.from(Object.values(comics))

  return new Response(JSON.stringify(comicsArray))
}

export async function handleComicRequest(request: Request, comicName: string, comicsKV: KVNamespace) : Promise<Response> {
  const comicDefinition = comicDefinitions.find(c => c.name == comicName)
  if(comicDefinition == null)
  {
    return new Response(JSON.stringify({
      name: comicName,
      data: {
        errors: [comicName + ": not found"]
      }
    } as Comic))
  }

  const comics: Comics = await comicsKv.get(comicKvKey, "json") ?? {}
  const comic = await comicDefinition.getComic()
  dumpComic(comic)
  comics[comicDefinition.name] = comic

  await comicsKv.put(comicKvKey, JSON.stringify(comics))

  return new Response(JSON.stringify(comic))
}

function isUpToDate(comic: Comic, hours:number, minutes:number, jitterSecs: number = 0): boolean {
  if(hasErrors(comic)) {
    return age(comic) < 1*HOUR;
  }
  return age(comic) < (hours*HOUR + minutes*MINUTE + Math.random() * jitterSecs * SECOND);
}

export async function handleScheduled(comicsKV: KVNamespace): Promise<void> {
  console.log("Running scheduled function")

  await getAndUpdateComics(comicsKv, c => isUpToDate(c, 6, 0, 1800))
}

async function getAndUpdateComics(comicsKv: KVNamespace, upToDateCheck: (c: Comic) => boolean): Promise<Comics> {
  const comics: Comics = await comicsKv.get(comicKvKey, "json") ?? {}

  const updated = await Promise.all(comicDefinitions.map(async comicDefinition => {
    const comicInKv = comics[comicDefinition.name] ?? null

    if(comicInKv != null && upToDateCheck(comicInKv)) {
      console.log(`Up to date: ${comicDefinition.name}`)
      return false
    }

    console.log(`Loading comic: ${comicDefinition.name}`)
    try {
      console.log(`Start loading comic: ${comicDefinition.name}`)
      const comic = await comicDefinition.getComic()
      dumpComic(comic)
      if(hasErrors(comic)) {
        console.log(`Comic has errors:  ${comicDefinition.name}: ${comic.data.errors}`)
        if(comicInKv != null && age(comicInKv) < 24*HOUR) {
          console.log(`Not updating comic because of errors: ${comicDefinition.name}`)
          return false;
        }
      }

      comics[comicDefinition.name] = comic
      console.log(`Updated comic: ${comicDefinition.name}`)
      return true
    }
    catch(e: any) {
      console.error(`Error while loading comic ${comicDefinition.name}: ${e}\n${e.stack}`)
      return false
    }
  }))

  const comicNames = comicDefinitions.map(c => c.name)
  Object.keys(comics).filter(c => !comicNames.includes(c)).forEach(c => delete comics[c])

  if(updated.some(u => u)) {
    console.log("Saving updated comics")
    await comicsKv.put(comicKvKey, JSON.stringify(comics))
  }

  return comics
}

function dumpComic(comic: Comic)
{
  console.log(`${comic.name} (${new Date(comic.updated).toISOString()})`);
  console.log('  > ' + comic.linkUrl);

  for(const url of comic.data.intermediateUrls ?? []) {
    console.log('  > ' + url);
  }

  for(const media of comic.data.media) {
      console.log('  + ' + JSON.stringify(media));
  }

  for(const error of comic.data.errors ?? []) {
      console.log(' ! ' + error);
  }
  
}