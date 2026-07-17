"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.reduce.js");
require("core-js/modules/es.array.reverse.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.function.bind.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.create.js");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.set-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.for-each.js");
require("core-js/modules/esnext.iterator.reduce.js");
require("core-js/modules/web.dom-collections.for-each.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
require("core-js/modules/es.array.concat.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
var _VideoSelectionOverlay = _interopRequireDefault(require("./VideoSelectionOverlay"));
var _class, _class2, _descriptor, _descriptor2, _descriptor3;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
var VideoOptimizerField = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function VideoOptimizerField() {
    var _this;
    _classCallCheck(this, VideoOptimizerField);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, VideoOptimizerField, [].concat(args));
    _initializerDefineProperty(_this, "overlayOpen", _descriptor, _this);
    _initializerDefineProperty(_this, "openOverlay", _descriptor2, _this);
    _initializerDefineProperty(_this, "closeOverlay", _descriptor3, _this);
    _this.handleSelect = function (value) {
      _this.props.onChange(value);
      _this.props.onFinish();
    };
    _this.handleRemove = function () {
      _this.props.onChange(undefined);
      _this.props.onFinish();
    };
    return _this;
  }
  _inherits(VideoOptimizerField, _React$Component);
  return _createClass(VideoOptimizerField, [{
    key: "render",
    value: function render() {
      var value = this.props.value;
      var hasVideo = value && value.uuid;
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-field"
      }, hasVideo ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-field-preview"
      }, value.posterUrl ? /*#__PURE__*/_react["default"].createElement("img", {
        className: "vo-field-thumb",
        src: value.posterUrl,
        alt: value.title || ''
      }) : /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-field-thumb"
      }), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-field-meta"
      }, /*#__PURE__*/_react["default"].createElement("b", null, value.title || (0, _utils.translate)('scale_videooptimizer.field_label')), /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-field-badge"
      }, (0, _utils.translate)('scale_videooptimizer.selected')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-field-buttons"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.openOverlay
      }, (0, _utils.translate)('scale_videooptimizer.change_video')), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.handleRemove
      }, (0, _utils.translate)('scale_videooptimizer.remove_video'))))) : /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-field-empty"
      }, /*#__PURE__*/_react["default"].createElement("p", null, (0, _utils.translate)('scale_videooptimizer.no_video')), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "primary",
        onClick: this.openOverlay
      }, (0, _utils.translate)('scale_videooptimizer.select_video'))), /*#__PURE__*/_react["default"].createElement(_VideoSelectionOverlay["default"], {
        open: this.overlayOpen,
        onClose: this.closeOverlay,
        onSelect: this.handleSelect,
        locale: this.props.formInspector && this.props.formInspector.locale
      }));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "overlayOpen", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "openOverlay", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this2 = this;
    return function () {
      _this2.overlayOpen = true;
    };
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "closeOverlay", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this3 = this;
    return function () {
      _this3.overlayOpen = false;
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = VideoOptimizerField;