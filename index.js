// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var ParseDashboard = require('parse-dashboard');
var request = require('request');
var wordcut = require("wordcut");
var linebot = require('linebot');

var CHANNEL_SECRET = process.env.channelSecret;
var CHANNEL_ACCESS_TOKEN = process.env.channelToken;
var CHANNEL_ID = process.env.channelID;


var bot = linebot({
    channelId: CHANNEL_ID,
    channelSecret: CHANNEL_SECRET,
    channelAccessToken: CHANNEL_ACCESS_TOKEN
});
var botParser = bot.parser();
wordcut.init();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID || 'myAppId',
    restAPIKey: process.env.REST_KEY,
    masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
    liveQuery: {
        classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
    }
});
var allowInsecureHTTP = true;
var dashboard = new ParseDashboard({
    "apps": [{
        "serverURL": "http://bot-afaps.herokuapp.com/parse",
        "appId": "myAppId",
        "masterKey": "myMasterKey",
        "appName": "bot-afaps"
    }],
    "users": [{
        "user": "admin",
        "pass": "pass"
    }]
}, allowInsecureHTTP);

function containsAny(str, substrings) {
    for (var i = 0; i != substrings.length; i++) {
        var substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return substring;
        }
    }
    return null;
}



// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();
app.post('/linewebhook', botParser);

bot.on('message', function(event) {
    switch (event.message.type) {
        case 'text':
            var messageText = event.message.text;
            processMessage(messageText, function(responseMsg) {
                if (responseMsg == messageText) {
                    callParseServerCloudCode("getReplyMsg", '{"msg":"' + messageText + '"}', function(response) {
                        if (response == "") {
                            console.log("no msg reply");
                            /*event.reply("ข้าไม่เข้าใจที่เจ้าพูด").then(function(data) {
                                // success
                            }).catch(function(error) {
                                // error
                            });*/
                        } else {
                            event.reply(response).then(function(data) {
                                // success
                            }).catch(function(error) {
                                // error
                            });
                        }
                    });
                } else {
                    event.reply(responseMsg).then(function(data) {
                        // success
                    }).catch(function(error) {
                        // error
                    });
                }
            });


            break;
        case 'image':

            break;
        case 'video':

            break;
        case 'audio':
            //event.reply('Nice song!');
            break;
        case 'location':
            //event.reply(['That\'s a good location!', 'Lat:' + event.message.latitude, 'Long:' + event.message.longitude]);
            break;
        case 'sticker':
            /*
			event.reply({
				type: 'sticker',
				packageId: 1,
				stickerId: 1
			});*/
            break;
        default:
            console.log('unkwon type! :' + JSON.stringify(event));
            break;
    }
});

bot.on('follow', function(event) {
    //event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function(event) {
    //event.reply('unfollow: ' + event.source.userId);
});

bot.on('join', function(event) {
    ///	event.reply('join: ' + event.source.groupId);
});

bot.on('leave', function(event) {
    //	event.reply('leave: ' + event.source.groupId);
});

bot.on('postback', function(event) {
    event.reply('postback: ' + event.postback.data);
});

bot.on('beacon', function(event) {
    //	event.reply('beacon: ' + event.beacon.hwid);
});



// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/dashboard', dashboard);

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
    res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});
app.get('/testcut', function(req, res) {
    res.status(200).send(wordcut.cut('วันนี้เป็นวันอะไร'));
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);



function callParseServerCloudCode(methodName, requestMsg, responseMsg) {
    console.log("callParseServerCloudCode:" + methodName + "\nrequestMsg:" + requestMsg);
    var options = {
        url: 'https://reply-msg-parse-server.herokuapp.com/parse/functions/' + methodName,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Parse-Application-Id': 'myAppId',
            'X-Parse-REST-API-Key': 'myRestKey'
        },
        body: requestMsg
    };

    function callback(error, response, body) {
        console.log("response:" + JSON.stringify(response));
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            responseMsg(info.result.replyMsg);
            console.log("result.msg: " + info.result.msg + " result.replyMsg: " + info.result.replyMsg);
        } else {
            console.error("Unable to send message. Error :" + error);
        }
    }
    request(options, callback);
}

function processMessage(reqMsg, resMsg) {
    if (reqMsg.length > 6) {
        var checkMsg = reqMsg.substring(0, 4);
        switch (checkMsg) {
            case '#ask':
                // trainingCommand
                trainingCommand(reqMsg, function(res) {
                    if (!res) {
                        resMsg("ข้าว่ามีบางอย่างผิดพลาด ลองใหม่ซิ");
                        //failed
                    } else {
                        resMsg("ข้าจำได้แล้ว ลองทักข้าใหม่ซิ อิอิ");
                        //success
                    }
                });
                break;
            case '#bot':
                // botCommand
                resMsg("bot command");

                break;

            default:
                resMsg(reqMsg);
        }
    } else {
        // return original msg
        resMsg(reqMsg);
    }
}

function trainingCommand(msg, res) {
    msg = msg.replace("#ask ", "");
    msg = msg.replace(" #ans ", ":");
    var msgs = msg.split(":");
    var msgDatas = msgs[0].split(",");
    var replyDatas = msgs[1].split(",");
    msgDatas = JSON.stringify(msgDatas);
    replyDatas = JSON.stringify(replyDatas);
    var data = '{"msg":' + msgDatas + ',"replyMsg":' + replyDatas + '}';
    callParseServerCloudCode("botTraining", data, function(response) {
        console.log(response);
        res(response);
    });
}

function isBotCommand(msg, res) {
    if (msg.length > 6) {
        if (msg.substring(0, 4) == "#bot") {
            res(true);
        } else {
            res(false);
        }
    } else {
        res(false);
    }
}
