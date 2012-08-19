var MongoDb = require("mongodb"),
    ObjectID = MongoDb.ObjectID,
    db = new MongoDb.Db("test", new MongoDb.Server("localhost", 27017, {auto_reconnect: true}, {})),
    email   = require("./node_modules/emailjs/email"),
    server  = email.server.connect({
        user: "pablorobertos", 
        password: "********",
        host: "smtp.gmail.com",
        ssl: true
    });

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

            collection.findAndModify(criteria, [["_id", "asc"]], update, options, function (error, result) {
                server.send({
                    text: "The value posted: \n\n" + JSON.stringify(rsvpValue), 
                    from: "paulandkana.com <pablorobertos@gmail.com>", 
                    to: "Paul Roberts <psxpaul@gmail.com>, Kana Miyata <myt.kana@gmail.com>",
                    subject: "Someone RSVP'd for your wedding!"
                }, function (emailErr, message) {
                    console.log(emailErr || message);
                });
                callback(error, result);
            });
        });
    });
};

exports.findAll = function (key, callback) {
    db.collection("guests", function (err, collection) {
        collection.find().toArray(callback);
    });
};
