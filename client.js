const eejs = require('ep_etherpad-lite/node/eejs');
const settings = require('../../src/node/utils/Settings');

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content += eejs.require('ep_custom_styles/templates/scripts.html', {}, module);
  return cb();
};

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content += eejs.require('ep_custom_styles/templates/editbarMenuLeft.ejs', {}, module);
  return cb();
};

exports.eejsBlock_body = function (hook_name, args, cb) {
  args.content += eejs.require('ep_custom_styles/templates/custom_style_settings.ejs');
  return cb();
};

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content += '<link href="../static/plugins/ep_custom_styles/static/css/custom_styles.css" rel="stylesheet">';
};

exports.clientVars = function (hook, context, callback) {
  const pluginSettings = settings.ep_custom_styles;
  return callback({});
};
