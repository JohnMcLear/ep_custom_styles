      var db = require('ep_etherpad-lite/node/db/DB').db,
          fs = require('fs'),
       async = require('ep_etherpad-lite/node_modules/async'),
   Changeset = require("ep_etherpad-lite/static/js/Changeset"),
    settings = require('ep_etherpad-lite/src/node/utils/Settings'),
customStyles = require('./customStyles').customStyles;

// Remove cache for this procedure
db['dbSettings'].cache = 0;

var getEndPoints = [
  "customStyles.styles.get",
  "customStyles.styles.stylesForPad",
  "customStyles.styles.allStyles",
  "customStyles.styles.disabledStyles"
];

var setEndPoints = [
  "customStyles.styles.new",
  "customStyles.styles.update",
  "customStyles.styles.globalDisable",
  "customStyles.styles.disable",
  "customStyles.styles.delete"
];

exports.registerRoute = function (hook_name, args, callback) {

  // Need to pass auth!
  var apikey = fs.readFileSync("./APIKEY.txt","utf8");

  getEndPoints.map(function(method){
    args.app.get('/pluginAPI/'+method, function(req, res) {
      var response = customStyles;

      if(req.query.apikey !== apikey){
        console.warn("ep_custom_styles apikey wrong for API");
        res.statusCode = 401;
        res.send({code: 4, message: "no or wrong API Key", data: null});
        return;
      }

      method = method.replace("customStyles.styles.","");
      // object of requested params = req.query

      if(method === "new"){
        customStyles.styles[method](req.query.styleId, req.query.css, req.padId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "update"){
        customStyles.styles[method](req.query.styleId, req.query.css, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "globalDisable"){
        customStyles.styles[method](req.query.styleId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "disable"){
        customStyles.styles[method](req.query.styleId, req.padId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "delete"){
        customStyles.styles[method](req.query.styleId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "get"){
        customStyles.styles[method](req.query.styleId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "stylesForPad"){
        customStyles.styles[method](req.query.padId, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "setStylesForPad"){
        customStyles.styles[method](req.query.padId, styleIds, function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "allStyles"){
        customStyles.styles[method](function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

      if(method === "disabledStyles"){
        customStyles.styles[method](function(err, value){
          if(err) console.error(err);
          res.send(value);
        });
      }

    });
  })
  setEndPoints.map(function(method){
    args.app.post('/api/plugin/'+method, function(req, res) {
    });
  })
}

/*
  HTML Exports Styling
*/

exports.stylesForExport = function(hook, padId, cb){

  // Get Each Style from the Database
  customStyles.styles.stylesForPad(padId, function(err, styleIds){
    if(err) console.error(err);
    var cssString = "";
    if(!styleIds){
      return cb("");
    }
    async.eachSeries(styleIds, function(styleId,callback){
      console.error("styleId", styleId);
      // get it
      customStyles.styles.get(styleId, function(err, css){
        cssString += " " + css;
      });
      callback(null, styleId);
    },function(err){
      if(err){
        console.warn("Error getting CSS for this Pad", padId);
        return("");
      }
      if(cssString) cssString = cssString.replace(/\n/g, "");
      console.error("results", cssString);
      cb(cssString);
    })
  });
}

// Our Custom Style attribute will result in a customStyle:styleId class
exports.aceAttribsToClasses = function(hook, context){
  if(context.key.indexOf("customStyles") > -1){
    return [context.key];
  }
}

exports.aceAttribClasses = function(hook_name, attr, cb){
  // I need to return tag:customStyleName
  attr.sub = 'tag:sub';
  cb(attr);
}
