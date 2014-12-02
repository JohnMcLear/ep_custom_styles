var db = require('ep_etherpad-lite/node/db/DB').db;

exports.customStyles = {
  endpoints: ["customStyles.styles.new","customStyles.styles.update", "customStyles.styles.globalDisable", "customStyles.styles.disable", "customStyles.styles.delete", "customStyles.styles.get", "customStyles.styles.stylesForPad", "customStyles.styles.allStyles", "customStyles.styles.disabledStyles"],
  styles: {
    new: function(styleId, css, padId, cb){
      console.log("Creating new Style", styleId, css, padId || false);
      db.get("custom_style_css_"+styleId, function(err, alreadyExists){
        if(alreadyExists){
          console.error("StyleId already exists", styleId);
          return cb("alreadyExists");
        }else{
          // Doesn't already exist \o/
          db.get("custom_styles", function(err, styleIds){
            if(err) console.error(err);
            if(!styleIds) styleIds = [];
            styleIds.push(styleId);
            console.log("new styleIds", styleIds);
            db.set("custom_styles", styleIds);

            // if PadID is set we have to update the association etc.
            if(padId){
              db.get("custom_style_association_"+padId, function(err, styleIds){
                if(!styleIds) styleIds = [];
                styleIds.push(styleId);
                db.set("custom_style_association_"+padId, styleIds);
              });
            }
            cb(null, "All done :)");
          });
          db.set("custom_style_css_"+styleId, css);
        }
      })
    },
    update: function(styleId, css, cb){
      console.log("Updating Style", styleId, css || false);
      db.set("custom_style_css_"+styleId, css);
    },
    globalDisable: function(styleId, cb){
      console.log("Disabling Style", styleId);

    },
    disable: function(styleId, padId, cb){
      console.log("Disabling Style For Pad", styleId, padId);

    },
    delete: function(styleId, cb){
      console.log("Deleting Styles", styleId);
      db.set("custom_style_css_"+styleId, "");
    },
    get: function(styleId, cb){
      if(!styleId) return cb("no styleId set");
      console.log("Getting CSS for Style", styleId);
      db.get("custom_style_css_"+styleId, function(err, value){
        if(err) cb(err);
        console.warn("here", value);
        cb(null, value);
        // todo
      });
      
    },
    stylesForPad: function(padId, cb){
      console.log("Getting StyleIds for PadId", padId);
      db.get("custom_style_association_"+padId, function(err, value){
        if(err) cb(err);
        // console.warn("styles associated with ", padId, value);
        cb(null, value);
        // todo
      });

    },
    allStyles: function(cb){
      console.log("Getting all available Styles");
      db.get("custom_styles", function(err, value){
        if(err) cb(err);
        cb(null, value);
      })
    },
    disabledStyles: function(cb){
      console.log("Getting all disabled Styles");
    }
  }
}
