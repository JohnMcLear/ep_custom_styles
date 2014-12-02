      var db = require('ep_etherpad-lite/node/db/DB').db,
       async = require('../../src/node_modules/async'),
    settings = require('../../src/node/utils/Settings'),
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
  getEndPoints.map(function(method){
    args.app.get('/pluginAPI/'+method, function(req, res) {
      var response = customStyles;
      method = method.replace("customStyles.styles.","");
      console.warn(customStyles.styles);
      console.warn(method);
      customStyles.styles[method](function(err, value){
        if(err) console.error(err);
        res.send(value);
      });
    });
  })
  setEndPoints.map(function(method){
    args.app.post('/api/plugin/'+method, function(req, res) {
    });
  })
}

/**
 * Database manipulation
 */

// Updates the database with the email record
setAuthorEmail = function (userInfo, email){
  db.setSub("globalAuthor:" + userInfo.authorId, ["email"], email);
}

