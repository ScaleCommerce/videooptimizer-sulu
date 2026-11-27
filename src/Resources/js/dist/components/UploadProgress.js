"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = UploadProgress;
var _react = _interopRequireDefault(require("react"));
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// Status line of a running upload: text, progress bar and a cancel button.
function UploadProgress(_ref) {
  var status = _ref.status,
    percent = _ref.percent,
    onCancel = _ref.onCancel;
  if (!status) {
    return null;
  }
  var hasPercent = typeof percent === 'number';
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "vo-upload-status",
    role: "status"
  }, /*#__PURE__*/_react["default"].createElement("span", null, status, hasPercent ? ' ' + String(percent) + ' %' : ''), hasPercent && /*#__PURE__*/_react["default"].createElement("progress", {
    className: "vo-progress",
    max: "100",
    value: percent
  }), onCancel && /*#__PURE__*/_react["default"].createElement(_components.Button, {
    skin: "link",
    onClick: onCancel
  }, (0, _utils.translate)('scale_videooptimizer.cancel_upload')));
}