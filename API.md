API:

|                                         |                                              |                                                                                                                   |
| --------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `$objkt.isCapture`                      | `bool`                                       | `true` in the capture environment or when a `?capture` query parameter exists                                     |
| `$objkt.seed`                           | `integer`                                    | if `?seed=af628e00bde` is present the decimal integer from this hex string, otherwise a random integer            |
| `$objkt.capture()`                      | `() => Promise(void)`                        | triggers the capture by calling the default exporter with the provided resolution                                 |
| `$objkt.rnd()`                          | `() => float`                                | returns a random number `0 <= n < 1` based on `$objkt.seed`, you can reset the PRNG state with `$objkt.rnd(null)` |
| `$objkt.registerFeatures(obj)`          | `(obj) => obj`                               | registers features (key-values)                                                                                   |
| `$objkt.registerExport(args, exportFn)` | `(args, exportFn) => true`                   | registers an exporter for a mime and resolution                                                                   |
| `  args.mime`                           | `string`                                     | mime type                                                                                                         |
| `  args.resolution`                     | `{ x: int, y: int }`                         | default resolution                                                                                                |
| `  args.aspectRatio` (optional)         | `float`                                      | if provided this exporter will be only export respecting this aspect ratio                                        |
| `  args.default` (optional)             | `bool`                                       | if `true` this exporter will be used for the capture                                                              |
| `  exportFn`                            | `({resolution: {x, y}}) => Promise(dataURL)` | an async function returning a dataURL                                                                             |


Example:

```js

function draw(width = window.innerWidth, height = window.innerHeight) {
  /** 
   * …
   **/

  // here how the artist must trigger the capture, it will use the `default` exporter with the provided resolution
  // the capture will only be triggered if `$objkt.isCapture === true`
  $objkt.capture();
}

$objkt.registerExport(
  { mime: 'image/png', resolution: { x: 1024, y: 1024 }, default: true },
  pngExport
);

async function pngExport({ resolution: { x: x, y: y } }) {
  draw(x, y);
  const blob = await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
  draw();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
```

