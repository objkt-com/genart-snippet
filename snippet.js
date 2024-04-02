// the JS snippet provided by objkt, to be included by the artist in their generators
const query = new URLSearchParams(window.location.search);

const $objkt = {
  version: '0.0.1',
  registerExport,
  _exports: {},
  _exported: {},
  isCapture() {
    return query.has('capture');
  },
  capture,
};
window.$objkt = $objkt;

function registerExport(args, fn) {
  const err = new Error(`Cannot register export for ${JSON.stringify(args)}`);
  if (typeof fn !== 'function') throw err;
  if (typeof args?.mime !== 'string') throw err;
  if ($objkt._exports[args.mime]) throw err;

  $objkt._exports[args.mime] = { ...args, fn };

  if (parent && parent.registerExport) {
    parent.registerExport($objkt._exports[args.mime]);
  }

  return true;
}

async function capture(args) {
  if ($objkt.isCapture()) {
    const exporter = Object.values(this._exports).find(
      (o) => o.default === true
    );
    if (!exporter) throw new Error(`No default exporter found`);
    const exported = await exporter.fn(args);

    $objkt._exported = { mime: exporter.mime, exported };
    window.dispatchEvent(new Event('exported'));
    console.log('exported', exported);
  }
}
