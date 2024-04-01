let assert = chai.assert;

describe('$objkt', function () {
  describe('#rnd()', function () {
    it('should be deterministic', function () {
      $objkt.seed = 123;
      $objkt.rnd(null);
      assert.equal($objkt.rnd(), 0.21505506429821253);
      assert.equal($objkt.rnd(), 0.7675276368390769);
      assert.equal($objkt.rnd(), 0.33604247961193323);
      assert.equal($objkt.rnd(), 0.03844817215576768);
    });

    it('can be reset by passing null', function () {
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
});
