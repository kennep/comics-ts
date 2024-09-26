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

        let comics = await comicsResponse.json()
        hideLoad()
        updateLocalComicsTimestamp(comics)
        comics.sort((a, b) => b.firstSeen - a.firstSeen)
        comics.forEach((comic) => {
            var comicElement = createComicElement(comic)
            document.getElementById('comics').appendChild(comicElement)
        })
    } catch (e) {
        hideLoad()
        emitError('Error', e.toString())
    }
})

function nameToId(name: string)
{
    return name.replace(/[^A-Za-z]/g, "")
}

function createComicElement(comic: Comic)
{
    if (comic.data.errors && comic.data.errors.length > 0) {
        return createErrorElement(comic.name, comic.data.errors.join('\n'), comic.linkUrl, nameToId(comic.name), head => addReloadLink(head, comic))
    }

    const comicElement = document.createElement('article')
    comicElement.id = nameToId(comic.name)
    const head = document.createElement('h2');
    addReloadLink(head, comic)
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
    return comicElement
}

function addReloadLink(e: Element, comic: Comic, enabled: boolean = true) {
    const reloadLink = document.createElement('div')
    reloadLink.className="reload"
    if(enabled) {
        const link = document.createElement('a');
        link.href = "javascript:void(0)"
        link.onclick = _ => reload(comic)
        link.innerText = "⟳"
        reloadLink.appendChild(link)
    } else {
        reloadLink.innerText = "⟳"
        reloadLink.style.opacity = "0.5"
    }
    e.appendChild(reloadLink)
}

async function reload(comic: Comic) : Promise<boolean> {
    const id = nameToId(comic.name)
    const elementToReplace = document.getElementById(id)
    if(!elementToReplace) return

    let placeholder = document.createElement('article')
    placeholder.id = id;
    let head = document.createElement('h2')
    addReloadLink(head, comic, false)
    const link = document.createElement('a');
    link.setAttribute('href', comic.linkUrl);
    link.innerText = comic.name;
    head.appendChild(link);
    placeholder.appendChild(head)
    let div = document.createElement('div')
    div.className = "loading"
    div.innerHTML = "<progress>Loading...</progress>"
    placeholder.appendChild(div)
    placeholder.style.minHeight = elementToReplace.offsetHeight + "px"

    elementToReplace.replaceWith(placeholder)

    let comicElement: Element = null
    const comicResponse = await fetch('/comics/' + encodeURIComponent(comic.name))
    if (comicResponse.status != 200) {
        comicElement = createErrorElement(comic.name, `HTTP ${comicResponse.status}`, comic.linkUrl, id, head => addReloadLink(head, comic))
    } else {
        const updatedComic = await comicResponse.json() as Comic;
        comicElement = createComicElement(updatedComic)
    }

    document.getElementById(id)?.replaceWith(comicElement)
    return false;
}

function hideLoad() {
    document.getElementById('loading').style.display = 'none'
}

function createErrorElement(heading: string, content: string, link?: string, id?: string, headModifier?: (head: Element) => void) : Element {
    let error = document.createElement('article')
    if(id) {
        error.id = id
    }
    error.className = 'error'
    let h2 = document.createElement('h2');
    if(headModifier) {
        headModifier(h2)
    }
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
    return error
}

function emitError(heading: string, content: string, link?: string) {
    var error = createErrorElement(heading, content, link)
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