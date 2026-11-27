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
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/esnext.iterator.for-each.js");
require("core-js/modules/esnext.iterator.reduce.js");
require("core-js/modules/web.dom-collections.for-each.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.filter.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.map.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11;
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
// The organization's subtitle languages (shared by all videos): add with an optional player label, delete.
// A language that still carries subtitles cannot be deleted (the API answers 409).
var SubtitleLanguages = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function SubtitleLanguages() {
    var _this;
    _classCallCheck(this, SubtitleLanguages);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, SubtitleLanguages, [].concat(args));
    _initializerDefineProperty(_this, "languages", _descriptor, _this);
    _initializerDefineProperty(_this, "loading", _descriptor2, _this);
    _initializerDefineProperty(_this, "busy", _descriptor3, _this);
    _initializerDefineProperty(_this, "code", _descriptor4, _this);
    _initializerDefineProperty(_this, "label", _descriptor5, _this);
    _initializerDefineProperty(_this, "pendingDelete", _descriptor6, _this);
    _initializerDefineProperty(_this, "message", _descriptor7, _this);
    _this._unmounted = false;
    _initializerDefineProperty(_this, "handleCode", _descriptor8, _this);
    _initializerDefineProperty(_this, "handleLabel", _descriptor9, _this);
    _initializerDefineProperty(_this, "add", _descriptor0, _this);
    _initializerDefineProperty(_this, "askDelete", _descriptor1, _this);
    _initializerDefineProperty(_this, "cancelDelete", _descriptor10, _this);
    _initializerDefineProperty(_this, "confirmDelete", _descriptor11, _this);
    return _this;
  }
  _inherits(SubtitleLanguages, _React$Component);
  return _createClass(SubtitleLanguages, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      (0, _api.getSubtitleLanguages)().then((0, _mobx.action)(function (languages) {
        if (_this2._unmounted) {
          return;
        }
        _this2.languages = languages;
        _this2.loading = false;
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this2._unmounted) {
          return;
        }
        _this2.loading = false;
        _this2.message = {
          type: 'error',
          text: (0, _api.errorText)(e)
        };
      }));
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._unmounted = true;
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-card"
      }, /*#__PURE__*/_react["default"].createElement("h2", null, (0, _utils.translate)('scale_videooptimizer.subtitle_languages')), /*#__PURE__*/_react["default"].createElement("p", {
        className: "vo-intro"
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_languages_intro')), this.loading ? /*#__PURE__*/_react["default"].createElement(_components.Loader, null) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, this.languages.length === 0 ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint"
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_languages_missing_short')) : /*#__PURE__*/_react["default"].createElement("ul", {
        className: "vo-subtitles"
      }, this.languages.map(function (language) {
        return /*#__PURE__*/_react["default"].createElement("li", {
          key: language.code,
          className: "vo-subtitles__item"
        }, /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-subtitles__name"
        }, language.label || language.code, " ", /*#__PURE__*/_react["default"].createElement("code", null, language.code)), /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-subtitles__meta"
        }, (0, _utils.translate)('scale_videooptimizer.videos_count', {
          count: language.video_count || 0
        })), /*#__PURE__*/_react["default"].createElement(_components.Button, {
          skin: "link",
          disabled: _this3.busy,
          onClick: function onClick() {
            return _this3.askDelete(language);
          }
        }, (0, _utils.translate)('scale_videooptimizer.delete')));
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions",
        style: {
          alignItems: 'center',
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input vo-input--auto",
        placeholder: (0, _utils.translate)('scale_videooptimizer.subtitle_language_code'),
        value: this.code,
        disabled: this.busy,
        onChange: this.handleCode
      }), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input vo-input--auto",
        placeholder: (0, _utils.translate)('scale_videooptimizer.subtitle_language_label'),
        value: this.label,
        disabled: this.busy,
        onChange: this.handleLabel
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.add,
        loading: this.busy,
        disabled: !this.code.trim()
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_language_add'))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_language_help'))), this.message && /*#__PURE__*/_react["default"].createElement("div", {
        className: 'vo-message vo-message--' + this.message.type
      }, this.message.text), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        open: !!this.pendingDelete,
        title: (0, _utils.translate)('scale_videooptimizer.subtitle_language_delete'),
        confirmText: (0, _utils.translate)('scale_videooptimizer.delete'),
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        confirmLoading: this.busy,
        onConfirm: this.confirmDelete,
        onCancel: this.cancelDelete
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_language_delete_confirm', {
        language: this.pendingDelete ? this.pendingDelete.code : ''
      })));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "languages", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "code", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "label", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "pendingDelete", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "message", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "handleCode", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this4 = this;
    return function (event) {
      _this4.code = event.target.value;
    };
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "handleLabel", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this5 = this;
    return function (event) {
      _this5.label = event.target.value;
    };
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "add", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;
    return function () {
      var code = _this6.code.trim();
      if (!code) {
        return;
      }
      _this6.busy = true;
      _this6.message = null;
      (0, _api.createSubtitleLanguage)(code, _this6.label.trim()).then(function () {
        return (0, _api.getSubtitleLanguages)();
      }).then((0, _mobx.action)(function (languages) {
        if (_this6._unmounted) {
          return;
        }
        _this6.busy = false;
        _this6.languages = languages;
        _this6.code = '';
        _this6.label = '';
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this6._unmounted) {
          return;
        }
        _this6.busy = false;
        _this6.message = {
          type: 'error',
          text: (0, _api.errorText)(e)
        };
      }));
    };
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "askDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function (language) {
      _this7.pendingDelete = language;
    };
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "cancelDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function () {
      _this8.pendingDelete = null;
    };
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "confirmDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function () {
      var language = _this9.pendingDelete;
      if (!language) {
        return;
      }
      _this9.busy = true;
      _this9.message = null;
      (0, _api.deleteSubtitleLanguage)(language.code).then((0, _mobx.action)(function () {
        if (_this9._unmounted) {
          return;
        }
        _this9.busy = false;
        _this9.pendingDelete = null;
        _this9.languages = _this9.languages.filter(function (item) {
          return item.code !== language.code;
        });
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this9._unmounted) {
          return;
        }
        _this9.busy = false;
        _this9.pendingDelete = null;
        _this9.message = {
          type: 'error',
          text: (0, _api.errorText)(e)
        };
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = SubtitleLanguages;