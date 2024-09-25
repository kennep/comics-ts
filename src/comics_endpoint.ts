import { comicDefinitions } from './comics'
import { Comic } from './comic'

const comicKvKey = "comics.json"

type Comics = {[key:string]: Comic}

export async function handleComicsRequest(request: Request, comicsKV: KVNamespace): Promise<Response> {
  const comics = await getAndUpdateComics(comicsKv, c => isUpToDate(c, 12, 0))

  return new Response(JSON.stringify(comics))
}

function isUpToDate(comicInKv: Comic, hours:number, minutes:number, jitterSecs: number = 0): boolean {
  if(comicInKv.data.errors != null && comicInKv.data.errors.length >= 0) {
    return (new Date().getTime() - comicInKv.updated) < 3600000;
  }
  return (new Date().getTime() - comicInKv.updated) < (hours*3600000 + minutes*60000+ Math.random() * jitterSecs * 1000);
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
      comics[comicDefinition.name] = comic
      console.log(`Done loading comic: ${comicDefinition.name}`)
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