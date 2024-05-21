## objkt genart snippet

### Overview

The snippet should be included in all genart projects.
Its main functionalities are:
- letting artists generate random numbers with the seed of the minted token
- letting objkt export a capture, an image that will be used as display image and then resized as a thumbnail

Here's how the capture works:

1. the artwork must register a default exporter function
2. this function must return a data URL representing the display image
3. the artwork must call `$o.capture()` once it's ready for capture

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

|                                     |                                              |                                                                                                           |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `$o.isCapture`                      | `bool`                                       | `true` in the capture environment or when a `?capture` query parameter exists                             |
| `$o.seed`                           | `integer`                                    | if `?seed=af628e00bde` is present the decimal integer from this hex string, otherwise a random integer    |
| `$o.capture()`                      | `() => Promise(void)`                        | triggers the capture by calling the default exporter with the provided resolution                         |
| `$o.rnd()`                          | `() => float`                                | returns a random number `0 <= n < 1` based on `$o.seed`, one can reset the PRNG state with `$o.rnd(null)` |
| `$o.registerFeatures(obj)`          | `(obj) => obj`                               | registers features (key-values), one can unregister all featurs with `$o.registerFeatures()`              |
| `$o.registerExport(args, exportFn)` | `(args, exportFn) => true`                   | registers an exporter for a mime and resolution                                                           |
| `  args.mime`                       | `string`                                     | mime type                                                                                                 |
| `  args.resolution`                 | `{ x: int, y: int }`                         | default resolution                                                                                        |
| `  args.aspectRatio` (optional)     | `float`                                      | if provided this exporter will be only export respecting this aspect ratio                                |
| `  args.default` (optional)         | `bool`                                       | if `true` this exporter will be used for the capture                                                      |
| `  exportFn`                        | `({resolution: {x, y}}) => Promise(dataURL)` | an async function returning a dataURL                                                                     |

