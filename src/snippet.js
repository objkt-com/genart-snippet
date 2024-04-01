var query = new URLSearchParams(window.location.search);

window.$objkt = {
  _exports: {},
  _exported: null,
  _v: '0.0.1',
  capture,
  isCapture: query.has('capture'),
  registerExport,
  registerFeatures,
  seed: Math.floor(Math.random() * Date.now()),
};
if (query.has('seed')) {
  $objkt.seed =
    parseInt(
      query
        .get('seed')
        .replace(/[^0-9a-f]/gi, 'f')
        .padEnd(12, 'f'),
      16
    ) % Number.MAX_SAFE_INTEGER;
  query.set('seed', $objkt.seed.toString(16));
  window.history.pushState('', '', '?' + query.toString());
}
$objkt.rnd = (function splitmix32(a) {
  return (state) => {
    if (state === null) a = $objkt.seed;
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
})($objkt.seed);

function registerFeatures(features) {
  if (typeof features === 'undefined') {
    return ($objkt.features = null);
  }
  if (typeof features !== 'object' || Array.isArray(features)) {
    throw new Error('registerFeatures expects an object');
  }
  return ($objkt.features = features);
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
  args = {
    mime: args.mime,
    aspectRatio: args.aspectRatio,
    resolution: args.resolution,
    default: !!args.default,
  };

  $objkt._exports[args.mime] = { ...args, fn };
  cast('register-export', args);
  return true;
}

function cast(msgId, payload) {
  [parent, window].forEach((target) => {
    try {
      target?.postMessage({ ...payload, id: `$objkt:${msgId}` }, '*');
    } catch (_) {}
  });
}

async function capture() {
  if ($objkt.isCapture && !$objkt._exported) {
    $objkt._exported = { status: 'pending' };
    const exporter = Object.values($objkt._exports).find((o) => o.default === true);
    if (!exporter) throw new Error(`No default exporter found`);
    const exported = await exporter.fn({
      resolution: exporter.resolution,
      status: 'done',
    });

    $objkt._exported = { mime: exporter.mime, exported };
    cast('captured', { ...$objkt._exported });
  }
}

window.addEventListener('message', (e) => {
  if (e.data.id === '$objkt:export') {
    const exporter = $objkt._exports[e.data.mime];
    exporter?.fn(e.data).then((exported) => {
      cast('exported', { ...e.data, exported });
    });
  }
});
