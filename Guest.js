var MongoDb = require("mongodb"),
    ObjectID = MongoDb.ObjectID,
    db = new MongoDb.Db("test", new MongoDb.Server("localhost", 27017, {auto_reconnect: true}, {}));

db.open(function (err, db) {});

exports.authenticate = function (key, callback) {
    db.collection("guests", function (error, collection) {
        collection.findOne({key: key}, callback);
    });
};

exports.rsvp = function (key, rsvpValue, callback) {
    var criteria = {key: key },
        update = {$push: {}},
        options = {"new": true, "upsert": false};

    db.collection("guests", function (error, collection) {
        collection.findOne({key: key}, function (err, guest) {
            Object.keys(guest.people).forEach(function (person) {
                update.$push["people." + person] = rsvpValue[person];
            });

            collection.findAndModify(criteria, [["_id", "asc"]], update, options, callback);
        });
    });
};

exports.findAll = function (key, callback) {
    db.collection("guests", function (err, collection) {
        collection.find().toArray(callback);
    });
};
