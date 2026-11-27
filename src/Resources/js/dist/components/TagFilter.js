"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = TagFilter;
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.map.js");
var _react = _interopRequireDefault(require("react"));
var _utils = require("sulu-admin-bundle/utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// Filters a video list by one tag (the API returns only videos carrying it). Hidden while the organization has no tags.
function TagFilter(_ref) {
  var tags = _ref.tags,
    value = _ref.value,
    _onChange = _ref.onChange;
  if (tags.length === 0) {
    return null;
  }
  return /*#__PURE__*/_react["default"].createElement("select", {
    className: "vo-input vo-input--auto",
    "aria-label": (0, _utils.translate)('scale_videooptimizer.filter_by_tag'),
    value: value,
    onChange: function onChange(event) {
      return _onChange(event.target.value);
    }
  }, /*#__PURE__*/_react["default"].createElement("option", {
    value: ""
  }, (0, _utils.translate)('scale_videooptimizer.all_tags')), tags.map(function (tag) {
    return /*#__PURE__*/_react["default"].createElement("option", {
      key: tag.name,
      value: tag.name
    }, tag.name, " (", tag.video_count || 0, ")");
  }));
}