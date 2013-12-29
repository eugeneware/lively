var events = require('events'),
    Stream = require('stream'),
    inherits = require('util').inherits,
    diff = require('changeset'),
    clone = require('clone'),
    noop = function () {};

module.exports = ObserveStream;
function ObserveStream(scope, path) {
  Stream.Duplex.call(this, { objectMode: true });
  this.scope = scope;
  this.path = path;
  this.old = clone(this.scope[this.path]);

  var self = this;
  setImmediate(function () {
    self.$digest();
  });
}
inherits(ObserveStream, Stream.Duplex);

ObserveStream.prototype._read = noop;

ObserveStream.prototype._write = function (chunk, enc, cb) {
  if ('value' in chunk) {
    this.scope[this.path] = clone(chunk.value);
  } else if ('change' in chunk) {
    diff.apply(chunk.change, this.scope[this.path], true);
  }
};

ObserveStream.prototype.$digest = function () {
  var self = this;
  var new_ = clone(this.scope[this.path]);
  var changes = diff(this.old, new_);
  if (changes.length) {
    this.old = new_;
    self.push({change: changes});
  }
  setImmediate(function () {
    self.$digest();
  });
};
