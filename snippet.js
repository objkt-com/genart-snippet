// the JS snippet provided by objkt, to be included by the artist in their generators
const query = new URLSearchParams(window.location.search);

const $objkt = {
  version: '0.0.1',
  registerExport,
  _exports: {},
  _exported: null,
  isCapture: query.has('capture'),
  seed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
  capture,
};
window.$objkt = $objkt;
if (query.has('seed')) {
  $objkt.seed = parseInt(query.get('seed'), 16) % Number.MAX_SAFE_INTEGER;
}

function registerExport(args, fn) {
  const err = new Error(`Cannot register exporter for ${JSON.stringify(args)}`);
  if (typeof fn !== 'function') throw err;
  if (typeof args !== 'object' || Array.isArray(args)) throw err;
  if (typeof args.mime !== 'string') throw err;
  if (!args.resolution?.x || !args.resolution?.x) throw err;
  if ($objkt._exports[args.mime]) throw err;
  if (args.aspectRatio) {
    args.resolution.y = args.resolution.x * args.aspectRatio;
  }

  $objkt._exports[args.mime] = { ...args, fn };

  if (parent && parent.registerExport) {
    parent.registerExport($objkt._exports[args.mime]);
  }

  return true;
}

async function capture() {
  if ($objkt.isCapture && !$objkt._exported) {
    $objkt._exported = { status: 'pending' };
    const exporter = Object.values(this._exports).find(
      (o) => o.default === true
    );
    if (!exporter) throw new Error(`No default exporter found`);
    const exported = await exporter.fn({
      resolution: exporter.resolution,
      status: 'done',
    });

    $objkt._exported = { mime: exporter.mime, exported };
    // when the capture host gets this event it should retrieve the exported content from `$objkt._exported`
    [parent, window].forEach((target) =>
      target?.dispatchEvent(
        new CustomEvent('exported', { detail: $objkt._exported })
      )
    );
  }
}
