var events = require('events'),
    inherits = require('util').inherits,
    diff = require('changeset'),
    clone = require('clone'),
    createError   = require('errno').create
    LevelUPError  = createError('LevelUPError')
    NotFoundError = createError('NotFoundError', LevelUPError);

NotFoundError.prototype.notFound = true;
NotFoundError.prototype.status   = 404;

module.exports = LivelyDb;
module.exports.LivelyDb = LivelyDb;
function LivelyDb() {
  events.EventEmitter.call(this);
}
inherits(LivelyDb, events.EventEmitter);

LivelyDb.prototype.get = function (key, cb) {
  throw new Error('LivelyDb#get() not implemented');
};

LivelyDb.prototype.put = function (key, value, cb) {
  throw new Error('LivelyDb#put() not implemented');
};

LivelyDb.prototype.del = function (key, cb) {
  throw new Error('LivelyDb#del() not implemented');
};

module.exports.MemLively = MemLively;
function MemLively() {
  LivelyDb.call(this);
  this.db = { };
}
inherits(MemLively, LivelyDb);

MemLively.prototype.get = function (key, cb) {
  var self = this;
  setImmediate(function () {
    if (typeof self.db[key] === 'undefined') {
      return cb(new NotFoundError('Key not found in database ' +
                JSON.stringify(key)));
    }
    cb(null, clone(self.db[key]));
  });
};

MemLively.prototype.put = function (key, value, cb) {
  var old = this.db[key];
  var new_ = clone(value);

  var changes = diff(old, new_);
  this.db[key] = new_;
  if (changes.length) this.emit('change', key, changes);
  setImmediate(cb);
}

MemLively.prototype.del = function (key, cb) {
  delete this.db[key];
  setImmediate(cb);
}
