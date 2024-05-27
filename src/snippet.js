var query = new URLSearchParams(window.location.search);

window.$o = {
  _exports: {},
  _exported: null,
  _v: '0.0.1',
  capture,
  isCapture: query.has('capture'),
  registerExport,
  registerFeatures,
  seed: Math.floor(Math.random() * Date.now()) % 4294967296,
};
if (query.has('seed')) {
  $o.seed =
    parseInt(
      query
        .get('seed')
        .replace(/[^0-9a-f]/gi, 'f')
        .padStart(8, '0'),
      16
    ) % 4294967296;
  query.set('seed', $o.seed.toString(16));
  window.history.pushState('', '', '?' + query.toString());
}
$o.rnd = (function splitmix32(a) {
  return (state) => {
    if (state === null) a = $o.seed;
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
})($o.seed);

function registerFeatures(features) {
  if (typeof features === 'undefined') {
    return ($o.features = null);
  }
  if (typeof features !== 'object' || Array.isArray(features)) {
    throw new Error('registerFeatures expects an object');
  }
  return ($o.features = features);
}

function registerExport(args, fn) {
  const err = new Error(`Cannot register exporter for ${JSON.stringify(args)}`);
  if (typeof fn !== 'function') throw err;
  if (typeof args !== 'object' || Array.isArray(args)) throw err;
  if (typeof args.mime !== 'string') throw err;
  if (!args.resolution?.x || !args.resolution?.x) throw err;
  if ($o._exports[args.mime]) throw err;
  if (args.aspectRatio) {
    args.resolution.y = args.resolution.x * args.aspectRatio;
  }
  args = {
    mime: args.mime,
    aspectRatio: args.aspectRatio,
    resolution: args.resolution,
    default: !!args.default,
    thumb: !!args.thumb,
  };

  $o._exports[args.mime] = { ...args, fn };
  cast('register-export', args);
  return true;
}

function cast(msgId, payload) {
  [parent, window].forEach((target) => {
    try {
      target?.postMessage({ ...payload, id: `$o:${msgId}` }, '*');
    } catch (_) {}
  });
}

async function capture() {
  if ($o.isCapture && !$o._exported) {
    $o._exported = { status: 'pending' };
    const exporter = Object.values($o._exports).find((o) => o.default === true);
    if (!exporter) throw new Error(`No default exporter found`);
    const exported = await exporter.fn({
      resolution: exporter.resolution,
      status: 'done',
    });
    const { resolution, aspectRatio, mime } = exporter;
    $o._exported = { mime, resolution, aspectRatio, exported };
    cast('captured', { ...$o._exported });
  }
}

window.addEventListener('message', (e) => {
  if (e.data.id === '$o:export') {
    const exporter = $o._exports[e.data.mime];
    console.log(e.data);
    exporter?.fn(e.data).then((exported) => {
      cast('exported', { ...e.data, exported });
    });
  }
});
