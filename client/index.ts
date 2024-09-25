import * as DOMPurify from 'dompurify';

declare const __COMMIT_HASH__: string

type Comic = {
    name: string
    linkUrl: string
    data: ComicData
    firstSeen: number | null
}

type ComicMedia = {
    id?: string,
    href?: string,
    content?: string,
    type: string
}

type ComicData = {
    media: ComicMedia[]
    errors?: string[]
}

window.addEventListener('load', async function () {
    try {
        setVersion()

        let comicsResponse= await fetch('/comics')
        if (comicsResponse.status != 200) {
            throw new Error(`HTTP ${comicsResponse.status}`)
        }

        let comicsMap = await comicsResponse.json()
        let comics: Array<Comic> = Array.from(Object.values(comicsMap))
        hideLoad()
        updateLocalComicsTimestamp(comics)
        comics.sort((a, b) => b.firstSeen - a.firstSeen)
        comics.forEach((comic) => {
            if (comic.data.errors && comic.data.errors.length > 0) {
                emitError(comic.name, comic.data.errors.join('\n'), comic.linkUrl)
                return
            }
            const comicElement = document.createElement('article')
            const head = document.createElement('h2');
            const link = document.createElement('a');
            link.setAttribute('href', comic.linkUrl);
            link.innerText = comic.name;
            head.appendChild(link);
            comicElement.appendChild(head);

            for (var media of comic.data.media) {
                if (media.type == 'image') {
                    const p = document.createElement('p');
                    const img = document.createElement('img');
                    img.setAttribute('src', media.href);
                    p.appendChild(img);
                    comicElement.appendChild(p);
                }
    
                if (media.type == 'text') {
                    let p = document.createElement('p');
                    p.innerText = media.content;
                    comicElement.appendChild(p);
                }

                if (media.type == 'title') {
                    let h = document.createElement('h3');
                    h.innerText = media.content;
                    comicElement.appendChild(h);
                }

                if (media.type == 'html') {
                    let p = document.createElement('p');
                    p.innerHTML = DOMPurify.sanitize(media.content);
                    comicElement.appendChild(p);
                }

                if (media.type == 'youtube') {
                    let iframe = document.createElement('iframe');
                    iframe.width = "100%";
                    iframe.height = "360";
                    iframe.allowFullscreen = true;
                    iframe.allow = "encrypted-media";
                    iframe.title = comic.name;
                    iframe.src = "https://www.youtube-nocookie.com/embed/" + media.id;
                    comicElement.appendChild(iframe);
                }
            }
            for (var image of comicElement.getElementsByTagName('img')) {
                image.addEventListener('click', toggleZoom)
            }
            document.getElementById('comics').appendChild(comicElement)
        })
    } catch (e) {
        hideLoad()
        emitError('Error', e.toString())
    }
})

function hideLoad() {
    document.getElementById('loading').style.display = 'none'
}

function emitError(heading: string, content: string, link?: string) {
    let error = document.createElement('article')
    error.className = 'error'
    let h2 = document.createElement('h2');
    if(link) {
        let a = document.createElement('a');
        a.href = link;
        a.innerText = heading;
        h2.appendChild(a);
    }
    else {
        h2.innerText = heading;
    }
    error.appendChild(h2);
    let p = document.createElement('p');
    p.innerText = content;
    error.appendChild(p);
    document.body.appendChild(error)
}

function toggleZoom(event: MouseEvent) {
    ; (event.target as HTMLImageElement).classList.toggle('zoomed')
}

function updateLocalComicsTimestamp(comics: Array<Comic>) {
    let currentComicsTimestamps = JSON.parse(
        localStorage.getItem('comicTimestamps') ?? '{}',
    )
    let newComicsTimestamps = {}
    comics.forEach((comic) => {
        let key = JSON.stringify(comic.data.media);
        comic.firstSeen = currentComicsTimestamps[key] ?? Date.now()
        newComicsTimestamps[key] = comic.firstSeen
    })

    localStorage.setItem('comicTimestamps', JSON.stringify(newComicsTimestamps))
}

function setVersion()
{
    document.getElementById("version").innerText = __COMMIT_HASH__;
}