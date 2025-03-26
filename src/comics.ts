import { ComicDefinition, DirectUrlComic, NavigateParseComic, ParseComic, singleImage, singleImageWithTitle } from './comic'

class DagbladetComic extends ParseComic {
  constructor(name: string) {
    super(name, "https://www.dagbladet.no/tegneserie", ($) => {
      return singleImage($('img', $(`article.comic:contains("${name}")`)).attr('src')); 
    })
  }
}

export var comicDefinitions: ComicDefinition[] = [
  new DirectUrlComic('Lunch', 'https://e24.no', (_) => {
    const now = new Date().toISOString()
    return 'https://api.e24.no/content/v1/comics/' + now.substring(0, 10)
  }),
  new ParseComic('XKCD', 'https://www.xkcd.com/', ($) => {
    return singleImageWithTitle(
      $('#comic img').attr('src'),
      $('#comic img').attr('title')
    );
  }),
  new ParseComic('Spinnerette', 'https://www.spinnyverse.com', ($) => {
    return singleImage($('img#cc-comic').attr('src'));
  }),
  new ParseComic('Cassiopeia Quinn', 'https://www.cassiopeiaquinn.com/', ($) => {
    return singleImage($('img#cc-comic').attr('src'));
  }),
  new ParseComic('Ctrl-Alt-Del', 'https://cad-comic.com/', ($) => {
    return singleImage($('img.comic-display').attr('src'));
  }),
  new ParseComic('SMBC', 'https://www.smbc-comics.com/', ($) => {
    return {
      media: [
        {type: 'image', href: $('img#cc-comic').attr('src')},
        {type: 'image', href: $('div#aftercomic img').attr('src')},
        {type: 'text', content: $('img#cc-comic').attr('title')}
      ]
    }
  }),
  new ParseComic('MonkeyUser', 'https://www.monkeyuser.com/?dir=last', ($, body) => {
    const img = $('.content img').attr('src');
    if (img) {
      return singleImageWithTitle($('.content img').attr('src'),  $('.content img').attr('title'));
    } else {
      const vidMatch = body.match(/videoId: *"([^"]*)"/)
      if (vidMatch) {
        return {
          media: [{type: 'youtube', id: vidMatch[1]}]
        }
      }
    }
    return {media: []};
  }),
  new NavigateParseComic('Loading Artist', 'https://loadingartist.com/', 
    ($) => { return $('a.comic-thumb.wide').attr('href') },
    ($) => {
      return {
        media: [
          {type: 'image', href: $('div.main-image-container img').attr('src')},
          {type: 'title', content: $('div.main-image-container img').attr('title')}
        ]
    }
  }),
  new ParseComic('War and Peas', 'https://warandpeas.com/', ($) => {
    // There's little to go by in the structure to identify the correct image, but we try our best...
    return singleImage($('div.entry-content img', $('article.tag-webcomic').first()).last().attr('data-orig-file')); 
  }),
  new ParseComic('Poorly Drawn Lines', 'https://poorlydrawnlines.com/', ($) => {
    return singleImage($('div.entry-content img').attr('data-src')); 
  }),
  new ParseComic('ToonHole', 'https://toonhole.com/', ($) => {
    return singleImage($('img.wp-post-image').attr('src')); 
  }),
  new NavigateParseComic('Work Chronicles', 'https://workchronicles.substack.com/archive', 
    ($) => {
      return $('a.pencraft[href^=https://workchronicles.substack.com/p/]').attr('href');
    },
    ($) => {
      return singleImage($('article picture img').attr('src')?.replace(/w_[0-9]+,h_[0-9]+,c_fill,/, "w_800,"));
    }),
  /* Dagbladet comics are currently down
  new DagbladetComic("Rutetid"),
  new DagbladetComic("Hurtigmat"),
  new DagbladetComic("Flisespikkeri"),
  new DagbladetComic("Ting jeg gjorde"),
  new DagbladetComic("Radio Gaga"),
  */
]
