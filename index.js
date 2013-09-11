var _      = require('underscore')
  , fs     = require('fs')
  , path   = require('path')
  , crypto = require('crypto')
  ;


function JSONFile (collection, config) {
  this.config = config || {};
  var file = this.file = path.join(config.path, collection + '.json');

  fs.exists(file, function (exists) {
    if (!exists) {
      fs.writeFile(file, JSON.stringify([]), function (err) {
        console.log('created ' + file);
      });
    }
  });
}


JSONFile.prototype.createID = function () { 
  return crypto.randomBytes(10).toString('hex');
};


function read (path, callback) {
  fs.readFile(path, function (err, str) {
    if (err) { 
      return callback(err); 
    }

    try {
      callback(null, JSON.parse(str));
    } catch (e) {
      callback(e);
    }
  });
}


function write (path, data, callback) {
  fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
    if (err) { return callback(err); }
    callback(null);
  });
}


function find (data, conditions, callback) {
  var result, key = Object.keys(conditions).pop();

  if (key) {

    var keys = key.split('.');
    result = _.find(data, function (doc) { 
      if (keys.length === 1) { return doc[keys[0]] === conditions[key]; }
      if (keys.length === 2) { return doc[keys[0]][keys[1]] === conditions[key]; }
    });

  } else {
    result = data;
  }

  callback(null, result || null);   
}


JSONFile.prototype.save = function (doc, callback) {
  var file = this.file;
  read(file, function (err, data) {
    if (err) { return callback(err); }
    data.push(doc);
    write(file, data, callback);
  });
};


JSONFile.prototype.find = function (conditions, options, callback) {
  if (callback === undefined) {
    callback = options;
    options = {};
  }

  read(this.file, function (err, data) {
    if (err) { return callback(err); }
    find(data, conditions, callback);
  });
};


JSONFile.prototype.destroy = function(conditions, callback) {
  var file = this.file;

  read(file, function (err, data) {
    if (err) { return callback(err); }

    find(data, conditions, function (err, result) {
      if (err) { return callback(err); }
      
      var i = data.indexOf(result);
      if (i !== -1) { data.splice(i, 1); }

      write(file, data, callback);
    });
  });
};


module.exports = JSONFile;