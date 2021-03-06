// Module dependencies.
var express = require("express"),
    app = express(),
    Comment = require("./Comment"),
    Guest = require("./Guest"),
    port = process.env.PORT || 3000,
    bannedIpMap = {};

app.configure(function () {
    app.set("port", port);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    app.use(express["static"](__dirname + "/public"));
});

app.configure("development", function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
    app.use(express.errorHandler());
});

function authenticate(key, ipAddress, success, failure) {
    var numTried = bannedIpMap[ipAddress] || 0;
    console.log("auth request from: " + ipAddress);

    if (numTried > 4) {
        console.log("skipping request from " + ipAddress + " because its failed " + numTried + " times.");
        failure("You have specified an incorrect invitation code too many times. Please contact psxpaul@gmail.com for assistance.");
    } else {
        Guest.authenticate(key, function (error, result) {
            if (error || !result) {
                bannedIpMap[ipAddress] = numTried + 1;
                failure("You have specified an incorrect invitation code. You have " + (4 - numTried) + " attempts remaining.");
            } else {
                success(result);
            }
        });
    }
}


// Routes
app.get("/private/:path", function (req, res) {
    var authKey = req.cookies.authentication,
        path = req.params.path,
        ip = req.header("X-Forwarded-For") || req.connection.remoteAddress;

    console.log("request for: " + __dirname + "/private/" + req.params.file);

    authenticate(authKey, ip, function (guest) {
        if (path === "rsvpList") {
            Guest.findAll(authKey, function (error, result) {
                if (error) {
                    res.json(error, 400);
                } else if (!result) {
                    res.send(404);
                } else {
                    res.json(result);
                }
            });
        } else {
            res.sendfile(__dirname + "/private/" + path);
        }
    }, function (msg) {
        console.log("oops");
        res.json(msg, 404);
    });
    
});

app.get("/comments", function (req, res) {
    var article = req.query.article;

    Comment.findForArticle(article, function (error, results) {
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

app.post("/authenticate", function (req, res, next) {
    var ip = req.header("X-Forwarded-For") || req.connection.remoteAddress,
        key = req.body.key;

    console.log("Authenticating: " + key);

    authenticate(key, ip, function (guest) {
        res.cookie("authentication", guest.key, {expires: new Date("12-12-2012")});
        res.json(guest);
    }, function (msg) {
        res.json(msg, 404);
    });
});

app.get("/whoami", function (req, res, next) {
    var authKey = req.cookies.authentication,
        ip = req.header("X-Forwarded-For") || req.connection.remoteAddress;

    authenticate(authKey, ip, function (guest) {
        res.json(guest);
    }, function (msg) {
        res.json(msg, 404);
    });
});

app.post("/rsvp", function (req, res, next) {
    var authKey = req.cookies.authentication,
        ipAddress = req.header("X-Forwarded-For") || req.connection.remoteAddress,
        numTried = bannedIpMap[ipAddress],
        rsvpValue = req.body;

    console.log("rsvping: " + JSON.stringify(rsvpValue) + " with key " + authKey);

    if (numTried > 4) {
        console.log("skipping request from " + ipAddress + " because its failed " + numTried + " times.");
        res.json("You have specified an incorrect invitation code too many times. Please contact psxpaul@gmail.com for assistance.", 404);
    } else {
        Guest.rsvp(authKey, rsvpValue, function (error, result) {
            if (error || !result) {
                bannedIpMap[ipAddress] = numTried + 1;
                res.json("You have specified an incorrect invitation code. You have " + (4 - numTried) + " attempts remaining.", 404);
            } else {
                res.json(result, 200);
            }
        });
    }
});

app.listen(port, function () {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});
