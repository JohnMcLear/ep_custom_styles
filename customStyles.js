const db = require('ep_etherpad-lite/node/db/DB').db;

exports.customStyles = {
  endpoints: ['customStyles.styles.new', 'customStyles.styles.update', 'customStyles.styles.globalDisable', 'customStyles.styles.disable', 'customStyles.styles.delete', 'customStyles.styles.get', 'customStyles.styles.stylesForPad', 'customStyles.styles.allStyles', 'customStyles.styles.disabledStyles'],
  styles: {
    new(styleId, css, padId, cb) {
      // console.log("Creating new Style", styleId, css, padId || false);
      db.get(`custom_style_css_${styleId}`, (err, alreadyExists) => {
        console.warn('alreadyExists', alreadyExists);
        if (alreadyExists) {
          console.error('StyleId already exists', styleId);
          return cb('alreadyExists');
        } else {
          // Doesn't already exist \o/
          db.get('custom_styles', (err, styleIds) => {
            if (err) console.error(err);
            if (!styleIds) styleIds = [];

            // check to see if this value already exists..
            // if it doesn't already exist then write it to the array
            if (styleIds.indexOf(styleId) === -1) {
              styleIds.push(styleId);
              // console.log("new styleIds", styleIds);
              db.set('custom_styles', styleIds);
            }

            // if PadID is set we have to update the association etc.
            if (padId) {
              db.get(`custom_style_association_${padId}`, (err, styleIds) => {
                if (!styleIds) styleIds = [];
                if (styleIds.indexOf(styleId) === -1) {
                  styleIds.push(styleId);
                  db.set(`custom_style_association_${padId}`, styleIds);
                }
              });
            }
            cb(null, 'All done :)');
          });
          db.set(`custom_style_css_${styleId}`, css);
        }
      });
    },
    update(styleId, css, cb) {
      // console.log("Updating Style", styleId, css || false);
      db.set(`custom_style_css_${styleId}`, css);
      cb(null);
    },
    globalDisable(styleId, cb) {
      // console.log("Disabling Style", styleId);

    },
    disable(styleId, padId, cb) {
      // console.log("Disabling Style For Pad", styleId, padId);

    },
    delete(styleId, cb) {
      // console.log("Deleting Styles", styleId);
      db.set(`custom_style_css_${styleId}`, '');
      cb(null);
    },
    get(styleId, cb) {
      if (!styleId) return cb('no styleId set');
      // console.log("Getting CSS for Style", styleId);
      db.get(`custom_style_css_${styleId}`, (err, value) => {
        if (err) cb(err);
        cb(null, value);
        // todo
      });
    },
    stylesForPad(padId, cb) {
      // console.log("Getting StyleIds for PadId", padId);
      db.get(`custom_style_association_${padId}`, (err, value) => {
        if (err) cb(err);
        // console.warn("styles associated with ", padId, value);
        cb(null, value);
        // todo
      });
    },
    setStylesForPad(padId, styleIds, cb) {
      // console.log("Setting StyleIds for PadId", padId, styleIds);
      const styleIdsType = Object.prototype.toString.call(styleIds);
      if (styleIdsType === '[object String]') {
        styleIds = [styleIds];
      }
      db.set(`custom_style_association_${padId}`, styleIds);
      cb(null, 'set styles!');
    },
    allStyles(cb) {
      // console.log("Getting all available Styles");
      db.get('custom_styles', (err, value) => {
        if (err) cb(err);
        cb(null, value);
      });
    },
    disabledStyles(cb) {
      // console.log("Getting all disabled Styles");
    },
  },
};
