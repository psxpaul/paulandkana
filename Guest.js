var MongoDb = require("mongodb"),
    ObjectID = MongoDb.ObjectID,
    db = new MongoDb.Db("test", new MongoDb.Server("localhost", 27017, {auto_reconnect: true}, {}));

db.open(function (err, db) {});

exports.authenticate = function (id, callback) {
    db.collection("guests", function (error, collection) {
        collection.findOne({_id: new ObjectID(id)}, callback);
    });
};

exports.rsvp = function (coming, plusOne, callback) {
    var criteria = {_id: new ObjectID(input._id) },
        update = {$set: {coming: coming, plusOne: plusOne}},
        options = {"new": true, "upsert": false};

    db.collection("guests", function (error, collection) {
        collection.findAndModify(criteria, [["_id", "asc"]], update, options, callback);
    });
};
