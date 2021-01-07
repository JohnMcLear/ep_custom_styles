const db = require('ep_etherpad-lite/node/db/DB').db;
const fs = require('fs');
const async = require('ep_etherpad-lite/node_modules/async');
const Changeset = require('ep_etherpad-lite/static/js/Changeset');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const customStyles = require('./customStyles').customStyles;

// Remove cache for this procedure
db.dbSettings.cache = 0;

const getEndPoints = [
  'customStyles.styles.get',
  'customStyles.styles.stylesForPad',
  'customStyles.styles.allStyles',
  'customStyles.styles.disabledStyles',
  'customStyles.styles.new',
  'customStyles.styles.update',
  'customStyles.styles.globalDisable',
  'customStyles.styles.disable',
  'customStyles.styles.delete',
  'customStyles.styles.setStylesForPad',

];

const setEndPoints = [
  'customStyles.styles.new',
  'customStyles.styles.update',
  'customStyles.styles.globalDisable',
  'customStyles.styles.disable',
  'customStyles.styles.delete',
];

exports.registerRoute = function (hook_name, args, callback) {
  // Need to pass auth!
  const apikey = fs.readFileSync('./APIKEY.txt', 'utf8');

  getEndPoints.map((method) => {
    args.app.get(`/pluginAPI/${method}`, (req, res) => {
      const response = customStyles;

      if (req.query.apikey !== apikey) {
        console.warn('ep_custom_styles apikey wrong for API');
        res.statusCode = 401;
        res.send({code: 4, message: 'no or wrong API Key', data: null});
        return;
      }

      method = method.replace('customStyles.styles.', '');
      // object of requested params = req.query

      if (method === 'new') {
        customStyles.styles[method](req.query.styleId, req.query.css, req.query.padId, (err, value) => { // this was using req.padId, which wasn't working
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'update') {
        customStyles.styles[method](req.query.styleId, req.query.css, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'globalDisable') {
        customStyles.styles[method](req.query.styleId, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'disable') {
        customStyles.styles[method](req.query.styleId, req.padId, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'delete') {
        customStyles.styles[method](req.query.styleId, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'get') {
        customStyles.styles[method](req.query.styleId, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'stylesForPad') {
        customStyles.styles[method](req.query.padId, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'setStylesForPad') {
        customStyles.styles[method](req.query.padId, req.query.styleIds, (err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'allStyles') {
        customStyles.styles[method]((err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }

      if (method === 'disabledStyles') {
        customStyles.styles[method]((err, value) => {
          if (err) console.error(err);
          res.send(value);
        });
      }
    });
  });
  setEndPoints.map((method) => {
    args.app.post(`/api/plugin/${method}`, (req, res) => {
    });
  });
};

/*
  HTML Exports Styling
*/

exports.stylesForExport = function (hook, padId, cb) {
  // Get Each Style from the Database
  customStyles.styles.stylesForPad(padId, (err, styleIds) => {
    if (err) console.error(err);
    let cssString = '';
    if (!styleIds) {
      return cb('');
    }
    async.eachSeries(styleIds, (styleId, callback) => {
      console.error('styleId', styleId);
      // get it
      customStyles.styles.get(styleId, (err, css) => {
        cssString += ` ${css}`;
      });
      callback(null, styleId);
    }, (err) => {
      if (err) {
        console.warn('Error getting CSS for this Pad', padId);
        return ('');
      }
      if (cssString) cssString = cssString.replace(/\n/g, '');
      console.error('results', cssString);
      cb(cssString);
    });
  });
};

// Our Custom Style attribute will result in a customStyle:styleId class
exports.aceAttribsToClasses = function (hook, context) {
  if (context.key.indexOf('customStyles') > -1) {
    return [context.key];
  }
};

exports.aceAttribClasses = function (hook_name, attr, cb) {
  // I need to return tag:customStyleName
  attr.sub = 'tag:sub';
  cb(attr);
};
