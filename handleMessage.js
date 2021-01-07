API = require('../../src/node/db/API.js'),
async = require('../../src/node_modules/async'),
settings = require('../../src/node/utils/Settings'),
padMessageHandler = require('../../src/node/handler/PadMessageHandler'),
customStyles = require('./customStyles.js').customStyles;

settings = settings.ep_custom_styles;

exports.handleMessage = function (hook_name, context, callback) {
  // call is not a custom plugin call
  if (!context.message || !context.message.data) return callback();

  // only handle endpoints we recognise
  if (customStyles.endpoints.indexOf(context.message.data.type) === -1) {
    // console.log("not supported", context.message.data.type, customStyles.endpoints);
    return callback();
  }

  const message = context.message.data;

  // Create New Custom Style
  if (message.type == 'customStyles.styles.new') {
    customStyles.styles.new(message.styleId, message.css, message.padId || false, (err, val) => {
      const request = [message.styleId, message.css, message.padId || false];
      if (err) {
        reply(context.client, 'customStyles.error.styleAlreadyExists', message.styleId, request);
        console.error(err);
      } else {
        // console.log("Created new style");
        broadcast(message.padId, message.type, message);
      }
    });
    callback([null]);
  }

  // Update Custom Style
  if (message.type == 'customStyles.styles.update') {
    customStyles.styles.update(message.styleId, message.css, (err, val) => {
      if (err) console.error(err);
      broadcast(message.padId, message.type, {styleId: message.styleId, css: message.css});
    });
    callback([null]);
  }

  // Globally disable a style
  if (message.type == 'customStyles.styles.globalDisable') {
    customStyles.styles.globalDisable(message.styleId, (err, cb) => {
      if (err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Delete a style
  if (message.type == 'customStyles.styles.delete') {
    customStyles.styles.delete(message.styleId, (err, val) => {
      if (err) console.error(err);
      broadcast(message.padId, message.type, {styleId: message.styleId});
    });
    callback([null]);
  }

  // Disable a style on a pad
  if (message.type == 'customStyles.styles.disable') {
    customStyles.styles.disable(message.styleId, message.padId, (err, cb) => {
      if (err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Get the CSS for a style
  if (message.type == 'customStyles.styles.get') {
    var request = [message.styleId];
    customStyles.styles.get(message.styleId, (e, css) => {
      if (e) console.error(e);
      console.warn('replying', 'customStyles.styles.get', css);
      reply(context.client, 'customStyles.styles.get', css, request);
    });
    callback([null]);
  }

  // Get the Styles associated with a pad
  if (message.type == 'customStyles.styles.stylesForPad') {
    var request = [message.padId];
    customStyles.styles.stylesForPad(message.padId, (e, styleIds) => {
      if (e) console.error(e);
      if (styleIds) {
        reply(context.client, 'customStyles.styles.stylesForPad', styleIds, request);
      }
    });
    callback([null]);
  }

  // Get all the styles on the server
  if (message.type == 'customStyles.styles.allStyles') {
    customStyles.styles.allStyles((err, cb) => {
      if (err) console.error(err);
      cb();
    });
    callback([null]);
  }

  // Get all the disabled styles on the server
  if (message.type == 'customStyles.styles.disabledStyles') {
    customStyles.styles.disabledStyles((err, cb) => {
      if (err) console.error(err);
      cb();
    });
    callback([null]);
  }
};


var reply = function (socket, method, data, request) {
  const blob = {
    type: 'COLLABROOM',
    data: {
      type: 'CUSTOM',
      payload: {
        request,
        type: 'custom_style',
        method,
        data,
      },
    },
  };

  blob.data.payload.data = data;
  // console.log("replied with", blob);
  socket.json.send(blob);
};

var broadcast = function (padId, method, data) {
  console.warn('data', data);
  padMessageHandler.handleCustomObjectMessage({
    type: 'COLLABROOM',
    data: {
      type: 'CUSTOM',
      payload: {
        padId,
        type: 'custom_style_get',
        method,
        data,
      },
    },
  }, false, (e) => {
    if (e) console.error('ERROR', e);
  });
};
