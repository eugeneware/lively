var expect = require('expect.js'),
    through2 = require('through2'),
    LivelyDb = require('../livelydb'),
    MemLively = LivelyDb.MemLively,
    LivelyStream = require('../livelystream'),
    ObserveStream = require('../observestream'),
    noop = function() {};

describe('Observe Stream', function() {
  it('should be able to monitor changes', function(done) {
    var obj = { target: { name: 'Eugene', number: 42 } };
    var os = new ObserveStream(obj, 'target');
    os.pipe(through2({ objectMode: true }, function (chunk, enc, cb) {
      expect(chunk.change).to.eql([
          { type: 'put', key: [ 'name' ], value: 'Susan' },
          { type: 'del', key: [ 'number' ] }
        ]);
      cb();
      done();
    }));

    obj.target.name = 'Susan';
    delete obj.target.number;
  });

  it('should be able to receive an initial value', function(done) {
    var obj = {};
    var os = new ObserveStream(obj, 'target');
    os.write({ value: { name: 'Eugene', number: 42 } });
    setImmediate(function () {
      expect(obj.target).to.eql({ name: 'Eugene', number: 42 });
      done();
    });
  });

  it('should be able to receive changes', function(done) {
    var obj = { target: { name: 'Eugene', number: 42 } };
    var os = new ObserveStream(obj, 'target');
    os.write({ change: [
      { type: 'put', key: [ 'name' ], value: 'Susan' },
      { type: 'del', key: [ 'number' ] }
    ]});
    setImmediate(function () {
      expect(obj.target).to.eql({ name: 'Susan' });
      done();
    });
  });

  it.only('should be able to work with LiveStreams', function(done) {
    var memdb = new MemLively();
    var ls = new LivelyStream(memdb, 'eugene', {});
    var obj = {};
    var os = new ObserveStream(obj, 'target');

    var count = 0;
    ls.pipe(os).pipe(ls);

    memdb.put('eugene', { name: 'Eugene', number: 42 }, noop);
    setImmediate(checkValue);

    function checkValue() {
      expect(obj).to.eql({ target: { name: 'Eugene', number: 42 } });
      changes();
    }

    function changes() {
      obj.target.name = 'Susan';
      delete obj.target.number;
      setTimeout(checkChange, 50);
    }

    function checkChange() {
      expect(memdb.db['eugene']).to.eql({ name: 'Susan' });
      done();
    }
  });
});
