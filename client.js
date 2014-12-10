var eejs = require("ep_etherpad-lite/node/eejs");
var settings = require('../../src/node/utils/Settings');

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_custom_styles/templates/scripts.html", {}, module);
  return cb();
};

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_custom_styles/templates/editbarMenuLeft.ejs", {}, module);
  return cb();
};

exports.eejsBlock_timesliderStyles = function (hook_name, args, cb){
  var padId = args.renderContext.req.params.pad;

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
        cssString += "\n" + css;
      });
      callback(null, styleId);
    },function(err){
      if(err){
        console.warn("Error getting CSS for this Pad", padId);
        return(args.content);
      }
      // if(cssString) cssString = cssString.replace(/\n/g, "");
      console.error("results", cssString);
      args.content += "<style type='text/css'>"+cssString+"</style>";
      return cb();
    })
  });
}

exports.eejsBlock_body = function (hook_name, args, cb) {
  args.content = args.content + eejs.require('ep_custom_styles/templates/custom_style_settings.ejs');
  return cb();
};

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = args.content + '<link href="../static/plugins/ep_custom_styles/static/css/custom_styles.css" rel="stylesheet">';
};

exports.clientVars = function(hook, context, callback) {
  var padId = context.pad.id;
  var pluginSettings = settings.ep_custom_styles;

  // Get Each Style from the Database
  // This is required to avoid a race condition in the timeslider
  customStyles.styles.stylesForPad(padId, function(err, styleIds){
    if(err) console.error(err);
    var cssString = "";
    if(!styleIds){
      return callback("");
    }
    var custom_style_styleIds = {ep_custom_styles_styleIds: styleIds};
    return callback(custom_style_styleIds);
  });
};
