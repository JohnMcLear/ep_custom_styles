              API = require('../../src/node/db/API.js'),
            async = require('../../src/node_modules/async'),
         settings = require('../../src/node/utils/Settings'),
padMessageHandler = require('../../src/node/handler/PadMessageHandler'),
     customStyles = require('./customStyles.js').customStyles;

settings = settings.ep_custom_styles;

exports.handleMessage = function(hook_name, context, callback){
  // call is not a custom plugin call
  if (!context.message || !context.message.data) return callback();

  // only handle endpoints we recognise
  if(customStyles.endpoints.indexOf(context.message.data.type) === -1){
    console.log("not supported", context.message.data.type, customStyles.endpoints);
    return callback();
  }

  var message = context.message.data;

  // Create New Custom Style
  if (message.type == 'customStyles.styles.new' ){
    customStyles.styles.new(message.styleId, message.css, message.padId || false, function(err, val){
      if(err) console.error(err);
      console.log("Created new style");
    });
    callback([null]);
  }

  // Update Custom Style
  if (message.type == 'customStyles.styles.update' ){
    customStyles.styles.update(message.styleId, message.css, function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Globally disable a style
  if (message.type == 'customStyles.styles.globalDisable' ){
    customStyles.styles.globalDisable(message.styleId, function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }
  
  // Delete a style
  if (message.type == 'customStyles.styles.delete' ){
    customStyles.styles.delete(message.styleId, function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Disable a style on a pad
  if (message.type == 'customStyles.styles.disable' ){
    customStyles.styles.disable(message.styleId, message.padId, function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Get the CSS for a style
  if (message.type == 'customStyles.styles.get' ){
    console.warn("doign a get", message);
    customStyles.styles.get(message.styleId, function(e, css){
      if(e) console.error(e);
      console.warn("replying", "customStyles.styles.get", css);
      reply(context.client, "customStyles.styles.get", css);
    })
    callback([null]);
  }

  // Get the Styles associated with a pad
  if (message.type == 'customStyles.styles.stylesForPad' ){
    customStyles.styles.stylesForPad(message.padId, function(e, styleIds){
      if(e) console.error(e);
      reply(context.client, "customStyles.styles.stylesForPad", styleIds);
    });
    callback([null]);
  }

  // Get all the styles on the server
  if (message.type == 'customStyles.styles.allStyles' ){
    customStyles.styles.allStyles(function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Get all the disabled styles on the server
  if (message.type == 'customStyles.styles.disabledStyles' ){
    customStyles.styles.disabledStyles(function(err, cb){
      if(err) console.error(err);
      cb();
    });
    callback([null]);
  }

}


var reply = function(socket, method, data){
  var blob = {
    type: "COLLABROOM",
    data: {
      type: "CUSTOM",
      payload: {
        type: "custom_style",
        method: method,
        data: data
      }
    }
  };

  blob.data.payload.data = data;
  console.log("replied with", blob);
  socket.json.send(blob);
}

/*

      // CAKE TO DO THIS WILL OVERWRITE EXISTING STYLES
      // Go ahead and save the style irrespective
      db.set("custom_style_css:"+name, css);

      // We will change this so that custom_style stores an array
      // of names of styles IE ["bigFont", "smallPenis"]
      db.get("custom_style:"+padId, function(err, dbcssNames){
        if(dbcssNames){
          dbcssNames.push(name);
        }else{
          dbcssNames = [];
          dbcssNames.push(name);
        }
         
        var css = [];
        // for each dbcss get the CSS values and send it
        if(!dbcssNames) return;
        async.forEach(Object.keys(dbcssNames), function(style){
          db.get("custom_style_css:"+name, function(err, cssItem){
            css.push(cssItem);
          });
        },function(err ,msg){
          padMessageHandler.handleCustomObjectMessage({
            type: "COLLABROOM",
            data: {
              type: "CUSTOM",
              payload: {
                padId: padId,
                type: "custom_style_get",
                css: css,
                name: name
              } 
            }
          }, false, function(e){
            if(e) console.error("ERROR", e)
          });
  
          db.set("custom_style:"+padId, dbcssNames);
        });
      });
      // The below line should be in place but it blows up execution for some reason?
  }

  if (context.message && context.message.data){
    if (context.message.data.type == 'CUSTOM_STYLE_GET' ) { // if it's a request to update an authors email
      var padId = context.message.data.padId;

      db.get("custom_style:"+padId, function(err, names){

        // for each dbcss get the CSS values and send it
        async.forEach(Object.keys(names), function(style){
          db.get("custom_style:"+style, function(err, names){

          });
        });
        console.warn("handle custom object message");

        context.client.json.send({
          type: "COLLABROOM",
          data: {
            type: "CUSTOM",
            payload: {
              padId: padId,
              type: "custom_style_get",
              names: names,
              css: css
            }
          }
        });

        console.warn("send shit to user");
        // The below line should be in place but it blows up execution for some reason?
        // callback([null]);


      });
    }
  }
};
*/
