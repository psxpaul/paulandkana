var MongoDb = require("mongodb"),
    ObjectID = MongoDb.ObjectID,
    Db = MongoDb.Db,
    db;

Db.connect("mongodb://localhost:27017/?w=1", function (err, db) {
    exports.findForArticle = function (articleQuery, callback) {
        db.collection("comments", function (err, collection) {
            collection.find({article: articleQuery}).toArray(callback);
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
});
