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
var _api = require("../services/api");
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
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
var Settings = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function Settings() {
    var _this;
    _classCallCheck(this, Settings);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, Settings, [].concat(args));
    _initializerDefineProperty(_this, "loading", _descriptor, _this);
    _initializerDefineProperty(_this, "saving", _descriptor2, _this);
    _initializerDefineProperty(_this, "removing", _descriptor3, _this);
    _initializerDefineProperty(_this, "showRemoveDialog", _descriptor4, _this);
    _initializerDefineProperty(_this, "configured", _descriptor5, _this);
    _initializerDefineProperty(_this, "token", _descriptor6, _this);
    _initializerDefineProperty(_this, "defaultLibraryId", _descriptor7, _this);
    _initializerDefineProperty(_this, "defaultPlayer", _descriptor8, _this);
    _initializerDefineProperty(_this, "message", _descriptor9, _this);
    _initializerDefineProperty(_this, "handleTokenChange", _descriptor0, _this);
    _initializerDefineProperty(_this, "handleLibraryChange", _descriptor1, _this);
    _initializerDefineProperty(_this, "handlePlayerChange", _descriptor10, _this);
    _initializerDefineProperty(_this, "handleSave", _descriptor11, _this);
    _initializerDefineProperty(_this, "handleTest", _descriptor12, _this);
    _initializerDefineProperty(_this, "handleRemoveClick", _descriptor13, _this);
    _initializerDefineProperty(_this, "handleRemoveCancel", _descriptor14, _this);
    _initializerDefineProperty(_this, "handleRemoveConfirm", _descriptor15, _this);
    return _this;
  }
  _inherits(Settings, _React$Component);
  return _createClass(Settings, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      (0, _api.getSettings)().then((0, _mobx.action)(function (data) {
        _this2.configured = !!data.configured;
        _this2.defaultLibraryId = data.defaultLibraryId || '';
        _this2.defaultPlayer = data.defaultPlayer || 'hosted';
        _this2.loading = false;
      }))["catch"]((0, _mobx.action)(function (error) {
        // Never trap the settings form behind a failed load — the token must always be enterable,
        // even when nothing is configured yet or the API routes are missing.
        _this2.loading = false;
        _this2.message = {
          type: 'error',
          text: error.message || String(error)
        };
      }));
    }
  }, {
    key: "render",
    value: function render() {
      if (this.loading) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-page"
        }, /*#__PURE__*/_react["default"].createElement(_components.Loader, null));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-page"
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-card"
      }, /*#__PURE__*/_react["default"].createElement("h1", null, (0, _utils.translate)('scale_videooptimizer.settings_title')), /*#__PURE__*/_react["default"].createElement("p", {
        className: "vo-intro"
      }, (0, _utils.translate)('scale_videooptimizer.settings_intro')), /*#__PURE__*/_react["default"].createElement("div", {
        className: 'vo-status ' + (this.configured ? 'vo-status--ok' : 'vo-status--warn')
      }, this.configured ? (0, _utils.translate)('scale_videooptimizer.token_configured') : (0, _utils.translate)('scale_videooptimizer.token_missing')), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.api_token')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "password",
        className: "vo-input",
        value: this.token,
        placeholder: (0, _utils.translate)('scale_videooptimizer.api_token_placeholder'),
        onChange: this.handleTokenChange,
        autoComplete: "off"
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.default_library')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        value: this.defaultLibraryId,
        onChange: this.handleLibraryChange
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.default_player')), /*#__PURE__*/_react["default"].createElement("select", {
        className: "vo-input",
        value: this.defaultPlayer,
        onChange: this.handlePlayerChange
      }, /*#__PURE__*/_react["default"].createElement("option", {
        value: "hosted"
      }, (0, _utils.translate)('scale_videooptimizer.player_hosted')), /*#__PURE__*/_react["default"].createElement("option", {
        value: "native"
      }, (0, _utils.translate)('scale_videooptimizer.player_native'))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "primary",
        onClick: this.handleSave,
        loading: this.saving
      }, (0, _utils.translate)('scale_videooptimizer.save')), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.handleTest,
        disabled: !this.configured
      }, (0, _utils.translate)('scale_videooptimizer.test_connection')), this.configured && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.handleRemoveClick,
        disabled: this.removing
      }, (0, _utils.translate)('scale_videooptimizer.remove_token'))), this.message && /*#__PURE__*/_react["default"].createElement("div", {
        className: 'vo-message vo-message--' + this.message.type
      }, this.message.text)), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        confirmLoading: this.removing,
        confirmText: (0, _utils.translate)('scale_videooptimizer.remove_token'),
        onCancel: this.handleRemoveCancel,
        onConfirm: this.handleRemoveConfirm,
        open: this.showRemoveDialog,
        title: (0, _utils.translate)('scale_videooptimizer.remove_token')
      }, (0, _utils.translate)('scale_videooptimizer.remove_token_confirm')));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "saving", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "removing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "showRemoveDialog", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "configured", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "token", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "defaultLibraryId", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "defaultPlayer", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return 'hosted';
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "message", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "handleTokenChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this3 = this;
    return function (event) {
      _this3.token = event.target.value;
    };
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "handleLibraryChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this4 = this;
    return function (event) {
      _this4.defaultLibraryId = event.target.value;
    };
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "handlePlayerChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this5 = this;
    return function (event) {
      _this5.defaultPlayer = event.target.value;
    };
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "handleSave", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;
    return function () {
      _this6.saving = true;
      _this6.message = null;
      (0, _api.saveSettings)({
        token: _this6.token,
        defaultLibraryId: _this6.defaultLibraryId,
        defaultPlayer: _this6.defaultPlayer
      }).then((0, _mobx.action)(function (data) {
        _this6.configured = !!data.configured;
        _this6.token = '';
        _this6.saving = false;
        _this6.message = {
          type: 'success',
          text: (0, _utils.translate)('scale_videooptimizer.saved')
        };
      }))["catch"]((0, _mobx.action)(function (error) {
        _this6.saving = false;
        _this6.message = {
          type: 'error',
          text: error.message || String(error)
        };
      }));
    };
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "handleTest", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function () {
      _this7.message = null;
      (0, _api.testConnection)().then((0, _mobx.action)(function (result) {
        _this7.message = result.ok ? {
          type: 'success',
          text: (0, _utils.translate)('scale_videooptimizer.test_ok', {
            count: result.libraryCount
          })
        } : {
          type: 'error',
          text: (0, _utils.translate)('scale_videooptimizer.test_failed', {
            message: result.message
          })
        };
      }));
    };
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "handleRemoveClick", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function () {
      _this8.showRemoveDialog = true;
    };
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "handleRemoveCancel", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function () {
      _this9.showRemoveDialog = false;
    };
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "handleRemoveConfirm", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function () {
      _this0.removing = true;
      _this0.message = null;
      (0, _api.clearToken)().then((0, _mobx.action)(function (data) {
        _this0.configured = !!data.configured;
        _this0.removing = false;
        _this0.showRemoveDialog = false;
        _this0.message = {
          type: 'success',
          text: (0, _utils.translate)('scale_videooptimizer.token_removed')
        };
      }))["catch"]((0, _mobx.action)(function (error) {
        _this0.removing = false;
        _this0.showRemoveDialog = false;
        _this0.message = {
          type: 'error',
          text: error.message || String(error)
        };
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = Settings;