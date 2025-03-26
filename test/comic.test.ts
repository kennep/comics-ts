import { exportedForTesting } from '../src/comic'
import { CheerioAPI, load } from 'cheerio'


const fixSrcSet = exportedForTesting.fixSrcSet;
const fixupHtml = exportedForTesting.fixupHtml;

describe('comic', () => {

  test('fixSrcSet', () => {
    const result = fixSrcSet("https://example.com", "/img/foo.jpg 1x, /img/bar.jpg 2x");

    expect(result).toEqual("https://example.com/img/foo.jpg 1x,https://example.com/img/bar.jpg 2x");
  })

  test('fixupHtml', () => {
    const result = fixupHtml("https://example.com", '<p>Blurble <a href="https://example.com">bloop<img src="/img/a" srcset="/img/a 1x, /img/b 2x"></a>Floof</p><p>Zorg<img src="/img/c"></p>');
    expect(result).toEqual('<p>Blurble <a href="https://example.com">bloop<img src="https://example.com/img/a" srcset="https://example.com/img/a 1x,https://example.com/img/b 2x"></a>Floof</p><p>Zorg<img src="https://example.com/img/c"></p>')
  });

  test('fixupHtml sanitizes script', () => {
    const result = fixupHtml("https://example.com", '<p>Hello <script>alert("Hello, World!")</script> World!</p>');
    expect(result).toEqual('<p>Hello &lt;script&gt;alert("Hello, World!")&lt;/script&gt; World!</p>');
  });


  test('fixupHtml sanitizes iframe', () => {
    const result = fixupHtml("https://example.com", '<p>Hello</p><iframe></iframe>');
    expect(result).toEqual('<p>Hello</p>&lt;iframe&gt;&lt;/iframe&gt;');
  });

  test('fixupHtml sanitizes javascript in attrs', () => {
    const result = fixupHtml("https://example.com", "<a href=\"javascript:alert('Hello, World!')\" onclick=\"alert('Hello, World!')\">link</a>");
    expect(result).toEqual('<a href="">link</a>');
  });

})
