var request = require('request');
var AWS = require('aws-sdk');
var express = require('express')
var app = express()

var docClient = new AWS.DynamoDB.DocumentClient({region: "us-west-2"});
var table = "cs499-hackathon2";
var recentTable = "hackathon2-recentlocation"

module.exports.fetch = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers:{
      "Access-Control-Allow-Origin" : "*"
    },
    body: JSON.stringify({
      message: 'bus location has been updated!'
    }),
  };

  fetchWaitingtimes();
  callback(null, response);
};

module.exports.queryRecent = (event, context, callback) => {
  queryWaitingtime(callback);
};

function fetchWaitingtimes() {
  request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var resp = JSON.parse(body);
      for(var i = 0; i < resp.length; i++){
        putItem(resp[i].id, resp[i].logo, resp[i].lat, resp[i].lng, resp[i].route);
        putRecentItem(resp[i].id, resp[i].logo, resp[i].lat, resp[i].lng, resp[i].route);
      }
    }
  })
}

function putItem(id, logo, latitude, longitude, route) {
  var params = {
      TableName:table,
      Item:{
          "id": id,
          "logo" : logo,
          "lat" : latitude,
          "lng" : longitude,
          "route" : route,
          "timestamp": Date.now(),
      }
  };

  console.log("Attempting to add a new item...");
  docClient.put(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
      }
  });
}

function putRecentItem(id, logo, latitude, longitude, route) {
  var params = {
      TableName:recentTable,
      Item:{
          "id": id,
          "logo" : logo,
          "lat" : latitude,
          "lng" : longitude,
          "route" : route,
      }
  };

  console.log("Attempting to add a new item to recent...");
  docClient.put(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
      }
  });
}

function queryWaitingtime(callback) {
  var params = {
    TableName : recentTable,
  };

  docClient.scan(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      if (callback) {
        const responseErr = {
          statusCode: 500,
          headers:{
            "Access-Control-Allow-Origin" : "*"
          },
          body: JSON.stringify({'err' : err})
        };
        callback(null, responseErr);
      }
    } else {
      data.Items.forEach(function(item) {
        console.log(item);
      });
      if (callback) {
        const responseOk = {
          statusCode: 200,
          headers:{
            "Access-Control-Allow-Origin" : "*"
          },
          body: JSON.stringify(data.Items)
        };
        callback(null, responseOk);
      }
    }
  });
}

// app.get('/fetch', function (req, res) {
//   fetchWaitingtimes();
//     res.send('OK');
// })
//
// app.get('/query', function (req, res) {
//   queryWaitingtime();
// })
//
// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!')
// })
