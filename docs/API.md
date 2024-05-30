## objkt genart snippet

### Overview

The snippet should be included in all genart projects.
Its main functionalities are:
- letting artists generate random numbers with the seed of the minted token
- letting objkt export a capture, an image that will be used as display image and then resized as a thumbnail

Here's how the capture works:

1. the artwork must register a single default exporter function (`default: true`)
2. this function must resolve to a data URL representing the display image
3. the artwork must call `$o.capture()` once it's ready for capture

An artwork can register other exports than the default one. You can use those to let viewers download images from your artwork instead of implementing a hotkey system (such as *hit `d` to download a PNG*.) The parent of your iframe, which we call *the host*, will know which exports have been registered and show buttons allowing viewers to trigger those exports.

Additionally, an artwork can register a custom thumbnail exporter. This is particularly interesting for animated GIFs. For thumb exports we enforce an aspect ratio of 1:1 (`resolution.y` will be set to the provided `resolution.x`) and strongly recommend a max resolution of 400x400px. Use `thumb: true`. There can be at most one thumbnail exporter.

Example:

```js
function draw(width = window.innerWidth, height = window.innerHeight) {
  /** 
   * …
   **/

  // here's how the artist must trigger the capture, it will use the `default` exporter with the provided resolution
  // the capture will only be triggered if `$o.isCapture === true`
  $o.capture();
}

$o.registerExport(
  { mime: 'image/png', resolution: { x: 1024, y: 1024 }, default: true },
  pngExport
);
$o.registerExport(
  { mime: 'image/gif', resolution: { x: 400, y: 400 }, thumb: true },
  animatedGifExport
);

async function pngExport({ resolution: { x: x, y: y } }) {
  draw(x, y);
  const blob = await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
```

### API

Every minted will be passed `seed=` and `seed2=`. `seed` will be different for each token while `seed2` is the same for all tokens of a project.

|                                     |                                              |                                                                                                           |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `$o.isCapture`                      | `bool`                                       | `true` in the capture environment or when a `?capture` query parameter exists                             |
| `$o.seed`                           | `integer`                                    | if `?seed=af628e00` is present the decimal integer from this hex string, otherwise a random integer       |
| `$o.seed2`                          | `integer`                                    | similar to `seed` but project-wide                                                                        |
| `$o.capture()`                      | `() => Promise(void)`                        | triggers the capture by calling the default exporter with the provided resolution                         |
| `$o.rnd()`                          | `() => float`                                | returns a random number `0 <= n < 1` based on `$o.seed`, one can reset the PRNG state with `$o.rnd(null)` |
| `$o.rnd2()`                         | `() => float`                                | same as `rnd()` but based on `$o.seed2`, a project-wide seed (identical for all tokens of a same project) |
| `$o.registerFeatures(obj)`          | `(obj) => obj`                               | registers features (key-values), one can unregister all featurs with `$o.registerFeatures()`              |
| `$o.registerExport(args, exportFn)` | `(args, exportFn) => true`                   | registers an exporter for a mime and resolution                                                           |
| `  args.mime`                       | `string`                                     | mime type                                                                                                 |
| `  args.resolution`                 | `{ x: int, y: int }`                         | default resolution                                                                                        |
| `  args.aspectRatio` (optional)     | `float`                                      | if provided this exporter will be only export respecting this aspect ratio                                |
| `  args.default` (optional)         | `bool`                                       | if `true` this exporter will be used for the capture                                                      |
| `  args.thumb` (optional)           | `bool`                                       | if `true` this exporter will be used for the thumbnail                                                    |
| `  exportFn`                        | `({resolution: {x, y}}) => Promise(dataURL)` | an async function returning a dataURL                                                                     |

