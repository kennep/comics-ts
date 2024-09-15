import { comicDefinitions } from './comics'
import { Comic } from './comic'

export async function handleComicsRequest(request: Request): Promise<Response> {
  const comics = comicDefinitions.map((c) => c.name)

  return new Response(JSON.stringify(comics))
}


export async function handleComicRequest(request: Request, comicName: string, comicsKV: KVNamespace): Promise<Response> {
  const matchingComics = comicDefinitions.filter(c => c.name == comicName)
  if(matchingComics.length == 0)
  {
    return new Response("comic not found",  {status: 404})
  }

  const comicKvKey = `${comicName}.json`
  const comicInKv: Comic | null = await comicsKV.get(comicKvKey, "json")
  if(comicInKv != null && isUpToDate(comicInKv)) {
    return new Response(JSON.stringify(comicInKv))
  }

  const comic = await matchingComics[0].getComic()
  const stringifiedComic = JSON.stringify(comic)
  await comicsKV.put(comicKvKey, stringifiedComic)

  return new Response(stringifiedComic)
}

function isUpToDate(comicInKv: Comic, jitter: number = 0): boolean {
  return (new Date().getTime() - comicInKv.updated) < (3600000 + Math.random() * jitter);
}

export async function handleScheduled(comicsKV: KVNamespace): Promise<void> {
  console.log("Running scheduled function")
  
  await Promise.all(comicDefinitions.map(async comicDefinition => {
    const comicKvKey = `${comicDefinition.name}.json`
    const comicInKv: Comic | null = await comicsKV.get(comicKvKey, "json")

    if(comicInKv != null && isUpToDate(comicInKv, 1800000)) {
      return;
    }

    console.log(`Loading comic: ${comicDefinition.name}`)
    try {
      const comic = await comicDefinition.getComic()
      await comicsKv.put(comicKvKey, JSON.stringify(comic))  
      console.log(`Done loading comic: ${comicDefinition.name}`)
    }
    catch(e: any) {
      console.error(`Error while loading comic ${comicDefinition.name}: ${e}\n${e.stack}`)
      return
    }
  }))
}