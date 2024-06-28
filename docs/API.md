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

Every minted token will be passed `seed=` and `seedGlobal=`. `seed` will be different for each token while `seedGlobal` is the same for all tokens of a project.

|                                     |                                              |                                                                                                                |
| ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `$o.isCapture`                      | `bool`                                       | `true` in the capture environment or when a `?capture` query parameter exists                                  |
| `$o.seed`                           | `[uint32, uint32, uint32, uint32]`           | see `parseSeed()`                                                                                              |
| `$o.seedGlobal`                     | `[uint32, uint32, uint32, uint32]`           | similar to `seed` but project-wide                                                                             |
| `$o.capture()`                      | `() => Promise(void)`                        | triggers the capture by calling the default exporter with the provided resolution                              |
| `$o.rnd()`                          | `() => float`                                | returns a random number `0 <= n < 1` based on `$o.seed`, one can reset the PRNG state with `$o.rnd(null)`      |
| `$o.rndGlobal()`                    | `() => float`                                | same as `rnd()` but based on `$o.seedGlobal`, a project-wide seed (identical for all tokens of a same project) |
| `$o.registerFeatures(obj)`          | `(obj) => obj`                               | registers features (key-values), one can unregister all featurs with `$o.registerFeatures()`                   |
| `$o.registerExport(args, exportFn)` | `(args, exportFn) => true`                   | registers an exporter for a mime and resolution                                                                |
| `  args.mime`                       | `string`                                     | mime type                                                                                                      |
| `  args.resolution`                 | `{ x: int, y: int }`                         | default resolution                                                                                             |
| `  args.aspectRatio` (optional)     | `float`                                      | if provided this exporter will be only export respecting this aspect ratio                                     |
| `  args.default` (optional)         | `bool`                                       | if `true` this exporter will be used for the capture                                                           |
| `  args.thumb` (optional)           | `bool`                                       | if `true` this exporter will be used for the thumbnail                                                         |
| `  exportFn`                        | `({resolution: {x, y}}) => Promise(dataURL)` | an async function returning a dataURL                                                                          |

### Environment

In the capture environment and on objkt.com the generator will get the following query parameters:

- `seed=hex`
  The seed specific to this token, usually a 32-digit hexadecimal string represents 16 bytes of entropy. For instance: `6fe6fb92b8b141fab578f4a3bd43b347`
- `seedGlobal=hex`
  The seed for this project, similar to `seed` except it will be the same for all tokens of a project.
- `iteration=int`
  A deterministically randomized iteration number. Only available to projects that have a max mints.
  For a project with max `N` tokens we'll define `iterations = shuffle(1..N)` and token `#M` will receive `?iteration=iterations[M-1]`.
  Note that the first minted token for project `foo` will still be named `foo #1` and the following tokens will be still be named sequentially.
  For instance:
    - A project with token title `foo` is created with max mints = 5.
    - `iterations = deterministicShuffle(1..5)` gives `[4,2,5,3,1]`, this list will be the same for all tokens
    - 1st minted token, `foo #1`, will get `?iteration=iterations[1-1]` so `iterations[0] = 4`
    - 2nd minted token, `foo #2`, will get `?iteration=iterations[2-1]` so `iterations[1] = 2`
    - Mth minted token, `foo #M`, will get `?iteration=iterations[M-1]`
- `ts=int`
  The Unix time representing the datetime of the mint transaction. For instance: `1530374852` for `2018-06-30T16:07:32Z`

In the capture environment, `capture=true` is also passed.
