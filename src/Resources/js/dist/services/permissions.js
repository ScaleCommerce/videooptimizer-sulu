"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.can = can;
exports.setPermissions = setPermissions;
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// What the current admin user may do with VideoOptimizer, as sent by the server in the admin config
// (config key `scale_videooptimizer`, field `permissions`, per area and permission type). The API refuses forbidden calls
// either way: this only hides the buttons. Without a config (e.g. an older server part) everything is allowed.
var permissions = null;
function setPermissions(value) {
  permissions = value && _typeof(value) === 'object' ? value : null;
}
function can(area, type) {
  if (!permissions) {
    return true;
  }
  var entry = permissions[area];
  if (!entry || typeof entry[type] !== 'boolean') {
    return true;
  }
  return entry[type];
}