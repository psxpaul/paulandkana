var MongoDb = require("mongodb"),
    ObjectID = MongoDb.ObjectID,
    db = new MongoDb.Db("test", new MongoDb.Server("localhost", 27017, {auto_reconnect: true}, {}));

db.open(function (err, db) {});

exports.findAll = function (callback) {
    db.collection("comments", function (err, collection) {
        collection.find().toArray(callback);
    });
};

exports.findById = function (id, callback) {
    db.collection("comments", function (error, collection) {
        collection.findOne({_id: new ObjectID(id)}, callback);
    });
};

exports.save = function (input, callback) {
    input.date = new Date();

    if (input._id) {
        input._id = new ObjectID(input._id);
    }

    db.collection("comments", function (error, collection) {
        collection.save(input, {safe: true}, callback);
    });
};
