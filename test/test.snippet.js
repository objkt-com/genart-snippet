let assert = chai.assert;

async function $objktReset() {
  let snippet;
  if ((snippet = document.getElementById('snippet'))) {
    snippet.remove();
  }
  const head = document.getElementsByTagName('head')[0];
  snippet = document.createElement('script');
  snippet.src = `../src/snippet.js?cache-bust=${Math.floor(Math.random() * 100000)}`;
  snippet.setAttribute('id', 'snippet');
  head.appendChild(snippet);
  $objkt.seed = 123;
  $objkt.rnd(null);
  // wait a tiny bit for the snippet to be compiled+executed
  return new Promise((resolve) => setTimeout(resolve), 100);
}

describe('$objkt', () => {
  beforeEach('reset + seed $objkt', $objktReset);

  describe('#rnd()', () => {
    it('should be deterministic', () => {
      $objkt.seed = 123;
      $objkt.rnd(null);
      assert.equal($objkt.rnd(), 0.21505506429821253);
      assert.equal($objkt.rnd(), 0.7675276368390769);
      assert.equal($objkt.rnd(), 0.33604247961193323);
      assert.equal($objkt.rnd(), 0.03844817215576768);
    });

    it('can be reset by passing null', () => {
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
      $objkt.registerExport(
        { resolution: { x: 1024, y: 1024 }, default: true, mime: 'image/png' },
        exportPng
      );
      assert.equal($objkt._exports['image/png'].resolution.x, 1024);
      assert.equal($objkt._exports['image/png'].default, true);
    });

    it('default export gets called', async function () {
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
      window.postMessage({ id: '$objkt:export', mime: 'image/png', resolution: { x: 1024, y: 1024 } });

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
  });
});
