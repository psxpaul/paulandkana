// Module dependencies.
var express = require("express"),
    app = module.exports = express.createServer(),
    Comment = require("./Comment"),
    Guest = require("./Guest"),
    bannedIpMap = {};

app.configure(function () {
    express.bodyParser.parse["text/plain"] = function (req, options, fn) {
        var buf = "";
        req.setEncoding("utf8");
        req.on("data", function (chunk) {
            buf += chunk;
        });

        req.on("end", function () {
            try {
                req.body = buf;
                fn();
            } catch (err) {
                fn(err);
            }
        });
    };

    app.use(express.bodyParser());
    app.use(express.cookieParser());
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

app.post("/authenticate", function (req, res, next) {
    var ip = req.header("X-Forwarded-For") || req.connection.remoteAddress;

    authenticate(req.body.key, ip, function (guest) {
        res.cookie("authentication", guest.key, {expires: new Date("12-12-2012")});
        res.json(guest);
    }, function (msg) {
        res.json(msg, 404);
    });
});

app.get("/whoami", function (req, res, next) {
    var key = req.cookies.authentication,
        ip = req.header("X-Forwarded-For") || req.connection.remoteAddress;

    authenticate(key, ip, function (guest) {
        res.json(guest);
    }, function (msg) {
        res.json(msg, 404);
    });
});

app.post("/rsvp", function (req, res, next) {
    var authKey = req.cookies.authentication,
        ipAddress = req.header("X-Forwarded-For") || req.connection.remoteAddress,
        numTried = bannedIpMap[ipAddress],
        rsvpValue = req.body.coming;

    console.log("rsvping: " + rsvpValue + " with key " + authKey);

    if (rsvpValue !== "no" && rsvpValue !== "yes" && rsvpValue !== "yesPlusOne") {
        res.json("Invalid selection: " + rsvpValue, 400);
    } else if (numTried > 4) {
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

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
