An implementation of the [FIX protocol (Financial Information Exchange)](http://en.wikipedia.org/wiki/Financial_Information_eXchange).

Forked from [nodefix by falconair](https://github.com/falconair/nodefix)

Currently the implementation is pre-beta.


Install
====

SOON

API
===

###Client:
```javascript

var client = new nodefix.Client({
    host: "demo.host.com",
    port: 80,
    fixVersion: "FIX.4.4",
    senderCompID: "**senderId**",
    targetCompID: "**targetId**",
    targetSubID: "**targetSubId**"
});

client.on("connect", function () {
    console.log("EVENT connect");
    client.logon("**username**", "**password**");
});

client.on("end", function () {
    console.log("EVENT end");
});

client.on("logon", function () {
    client.send("Market Data Request", [
        ["MDReqID", "EUR/USD please"],
        ["SubscriptionRequestType", "1"],
        ["MarketDepth", "1"],
        ["NoMDEntryTypes", "4"],
        ["MDEntryType", "0"],
        ["MDEntryType", "1"],
        ["MDEntryType", "7"],
        ["MDEntryType", "8"],
        ["NoRelatedSym", "4"],
        ["Symbol", "EUR/USD"],
        ["Symbol", "GBP/CAD"],
        ["Symbol", "GBP/JPY"],
        ["Symbol", "GBP/CHF"]
    ]);
    console.log("EVENT logon");
});

client.on("logoff", function () {
    console.log("EVENT logoff");
});

client.on("incoming", function (message) {
    console.log("IN", message.getFIX());
    console.log("IN", message.getType(), message.data);

    if (message.getType() === "Market Data-Snapshot/Full Refresh") {
        var price = message.getRepeating("MDEntryType", "MDEntryPx");
        console.log(message.get("Symbol"), "BID", price.Bid, "ASK", price.Offer);
    }
});

client.on("outgoing", function (message) {
    console.log("OUT", message.getFIX());
    console.log("OUT", message.getType(), message.data);
});

```



Not yet supported
===========

* Multi-version messaging
* Encryption


Known errors
===========

* Make sure ./traffic directory exists