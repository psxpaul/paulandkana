// Module dependencies.
var express = require("express"),
    app = module.exports = express.createServer(),
    Comment = require("./Comment");

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express["static"](__dirname + "/public"));
});

app.configure("development", function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
    app.use(express.errorHandler());
});


// Routes
app.get("/comments", function (req, res) {
    Comment.findAll(function (error, results) {
        if (error) {
            res.json(error, 400);
        } else if (!results) {
            res.send(404);
        } else {
            res.json(results);
        }
    });
});

app.get("/comment/:id", function (req, res) {
    Comment.findById(req.params.id, function (error, result) {
        if (error) {
            res.json(error, 400);
        } else if (!result) {
            res.send(404);
        } else {
            res.json(result);
        }
    });
});

app.post("/comment", function (req, res, next) {
    var input = req.body;

    if (!input.author) {
        res.json("author must be specified when saving a new comment", 400);
    } else if (!input.text) {
        res.json("text must be specified when saving a new comment", 400);
    } else { 
        Comment.save(input, function (error, objects) {
            if (error) {
                res.json(error, 400);
            } else if (objects === 1) {     //update
                res.json(input, 200);
            } else {                        //insert
                res.json(input, 201);
            }
        });
    }
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
