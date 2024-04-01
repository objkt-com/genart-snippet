const isBrowser = typeof window !== 'undefined';
const isNode = !isBrowser;

let assert, readFileSync, JSDOM, VirtualConsole;

if (isNode) {
  ({ assert } = await import('chai'));
  ({ readFileSync } = await import('fs'));
  ({ JSDOM, VirtualConsole } = await import('jsdom'));
} else {
  assert = chai.assert;
}

function init() {
  if (isNode) {
    const virtualConsole = new VirtualConsole();

    const dom = new JSDOM(`<script>${readFileSync('./src/snippet.js').toString()}</script>`, {
      runScripts: 'dangerously',
      virtualConsole,
    });
    virtualConsole.sendTo(console);

    return dom.window;
  }
  return window;
}

async function $objktReset() {
  if (!isBrowser) return;

  let snippet;
  if ((snippet = document.getElementById('snippet'))) {
    snippet.remove();
  }
  if (window.$objkt) {
    delete window.$objkt;
  }

  const head = document.getElementsByTagName('head')[0];
  snippet = document.createElement('script');
  snippet.src = `../src/snippet.js?cache-bust=${Math.floor(Math.random() * 100000).toString(16)}`;
  snippet.setAttribute('id', 'snippet');
  head.appendChild(snippet);

  await new Promise((resolve) => {
    snippet.onload = resolve;
  });

  window.$objkt.seed = 123;
  window.$objkt.rnd(null);
}

describe('$objkt', () => {
  beforeEach('reset + seed $objkt', $objktReset);
  describe('#rnd()', () => {
    it('should be deterministic', () => {
      const { $objkt } = init();
      $objkt.seed = 123;
      $objkt.rnd(null);
      assert.equal($objkt.rnd(), 0.21505506429821253);
      assert.equal($objkt.rnd(), 0.7675276368390769);
      assert.equal($objkt.rnd(), 0.33604247961193323);
      assert.equal($objkt.rnd(), 0.03844817215576768);
    });

    it('can be reset by passing null', () => {
      const { $objkt } = init();
      $objkt.seed = 928173;
      for (let i = 0; i < 2; i++) {
        $objkt.rnd(null);
        assert.equal($objkt.rnd(), 0.7746125012636185);
        assert.equal($objkt.rnd(), 0.3132142429240048);
        assert.equal($objkt.rnd(), 0.5991196266841143);
        assert.equal($objkt.rnd(), 0.590831205714494);
      }
    });
  });

  describe('#registerExport()', () => {
    beforeEach('reset + seed $objkt', $objktReset);
    const exportPng = async ({ resolution: { x, y } }) => 'foo';

    it('should register a default export', () => {
      const { $objkt } = init();
      $objkt.registerExport(
        { resolution: { x: 1024, y: 1024 }, default: true, mime: 'image/png' },
        exportPng
      );
      assert.equal($objkt._exports['image/png'].resolution.x, 1024);
      assert.equal($objkt._exports['image/png'].default, true);
    });

    it('default export gets called', async function () {
      const { $objkt, window } = init();
      const exportPng = async ({ resolution: { x, y } }) => {
        assert.equal(x, 900);
        assert.equal(y, 900);
        return 'foo';
      };
      $objkt.registerExport(
        { resolution: { x: 1024, y: 1024 }, default: true, mime: 'image/png' },
        exportPng
      );
      await new Promise((resolve) => setTimeout(resolve()), 100);
      window.postMessage({ id: '$objkt:export', mime: 'image/png', resolution: { x: 900, y: 900 } }, '*');

      return new Promise((resolve) => {
        const wait = ({ data }) => {
          if (data.id === '$objkt:exported') {
            assert.equal(data.exported, 'foo');
            window.removeEventListener('message', wait);
            resolve();
          }
        };
        window.addEventListener('message', wait);
      });
    });

    it('default export is used for capture at registered resolution', async function () {
      const { $objkt, window } = init();
      $objkt.isCapture = true;
      const exportPng = async ({ resolution: { x, y } }) => {
        assert.equal(x, 1024);
        assert.equal(y, 1024);
        return 'foo';
      };
      $objkt.registerExport(
        { resolution: { x: 1024, y: 1024 }, default: true, mime: 'image/png' },
        exportPng
      );
      await new Promise((resolve) => setTimeout(resolve()), 100);

      await window.capture();

      return new Promise((resolve) => {
        const wait = ({ data }) => {
          if (data.id === '$objkt:captured') {
            assert.equal(data.exported, 'foo');
            window.removeEventListener('message', wait);
            resolve();
          }
        };
        window.addEventListener('message', wait);
      });
    });
  });
});
