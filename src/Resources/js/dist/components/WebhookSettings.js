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
require("core-js/modules/es.date.to-string.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
var _permissions = require("../services/permissions");
var _api = require("../services/api");
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
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
// Webhook receiver: shows the URL to enter in the VideoOptimizer app and takes its signing secret (write-only,
// stored encrypted like the API token). The secret is saved together with the other settings.
var WebhookSettings = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function WebhookSettings() {
    var _this;
    _classCallCheck(this, WebhookSettings);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, WebhookSettings, [].concat(args));
    _initializerDefineProperty(_this, "copied", _descriptor, _this);
    _initializerDefineProperty(_this, "removing", _descriptor2, _this);
    _initializerDefineProperty(_this, "confirmRemove", _descriptor3, _this);
    _initializerDefineProperty(_this, "error", _descriptor4, _this);
    _this.urlInput = /*#__PURE__*/_react["default"].createRef();
    _initializerDefineProperty(_this, "copyUrl", _descriptor5, _this);
    _initializerDefineProperty(_this, "askRemove", _descriptor6, _this);
    _initializerDefineProperty(_this, "cancelRemove", _descriptor7, _this);
    _initializerDefineProperty(_this, "doRemove", _descriptor8, _this);
    return _this;
  }
  _inherits(WebhookSettings, _React$Component);
  return _createClass(WebhookSettings, [{
    key: "renderLastDelivery",
    value: function renderLastDelivery() {
      var last = this.props.settings.webhookLastDelivery;
      if (!last) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-hint"
        }, (0, _utils.translate)('scale_videooptimizer.webhook_never'));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint"
      }, (0, _utils.translate)('scale_videooptimizer.webhook_last', {
        event: last.event,
        time: new Date(last.time * 1000).toLocaleString()
      }));
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
        settings = _this$props.settings,
        secret = _this$props.secret,
        onSecretChange = _this$props.onSecretChange;
      var canEdit = (0, _permissions.can)('settings', 'edit');
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-card"
      }, /*#__PURE__*/_react["default"].createElement("h2", null, (0, _utils.translate)('scale_videooptimizer.webhook')), /*#__PURE__*/_react["default"].createElement("p", {
        className: "vo-intro"
      }, (0, _utils.translate)('scale_videooptimizer.webhook_intro')), /*#__PURE__*/_react["default"].createElement("div", {
        className: 'vo-status ' + (settings.webhookConfigured ? 'vo-status--ok' : 'vo-status--warn')
      }, settings.webhookConfigured ? (0, _utils.translate)('scale_videooptimizer.webhook_configured') : (0, _utils.translate)('scale_videooptimizer.webhook_missing')), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.webhook_url')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions",
        style: {
          marginTop: 0,
          alignItems: 'center'
        }
      }, /*#__PURE__*/_react["default"].createElement("input", {
        ref: this.urlInput,
        type: "text",
        className: "vo-input",
        readOnly: true,
        value: settings.webhookUrl || '',
        onFocus: function onFocus(event) {
          return event.target.select();
        }
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.copyUrl
      }, this.copied ? (0, _utils.translate)('scale_videooptimizer.copied') : (0, _utils.translate)('scale_videooptimizer.copy'))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.webhook_url_help')), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.webhook_secret')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "password",
        className: "vo-input",
        value: secret,
        placeholder: (0, _utils.translate)('scale_videooptimizer.webhook_secret_placeholder'),
        onChange: function onChange(event) {
          return onSecretChange(event.target.value);
        },
        disabled: !canEdit,
        autoComplete: "off"
      }), settings.webhookConfigured && /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, this.renderLastDelivery(), canEdit && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.askRemove,
        disabled: this.removing
      }, (0, _utils.translate)('scale_videooptimizer.webhook_remove')))), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        open: this.confirmRemove,
        title: (0, _utils.translate)('scale_videooptimizer.webhook_remove'),
        confirmText: (0, _utils.translate)('scale_videooptimizer.webhook_remove'),
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        confirmLoading: this.removing,
        onConfirm: this.doRemove,
        onCancel: this.cancelRemove
      }, (0, _utils.translate)('scale_videooptimizer.webhook_remove_confirm')));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "copied", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "removing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "confirmRemove", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "copyUrl", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this2 = this;
    return function () {
      var url = _this2.props.settings.webhookUrl;
      var done = (0, _mobx.action)(function () {
        _this2.copied = true;
      });
      var fallback = function fallback() {
        // Clipboard API unavailable (plain http): select the field so Ctrl/Cmd+C works.
        if (_this2.urlInput.current) {
          _this2.urlInput.current.select();
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, fallback);
      } else {
        fallback();
      }
    };
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "askRemove", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this3 = this;
    return function () {
      _this3.confirmRemove = true;
    };
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "cancelRemove", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this4 = this;
    return function () {
      _this4.confirmRemove = false;
    };
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "doRemove", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this5 = this;
    return function () {
      _this5.removing = true;
      _this5.error = null;
      (0, _api.clearWebhookSecret)().then((0, _mobx.action)(function (settings) {
        _this5.removing = false;
        _this5.confirmRemove = false;
        _this5.props.onChanged(settings);
      }))["catch"]((0, _mobx.action)(function (e) {
        _this5.removing = false;
        _this5.confirmRemove = false;
        _this5.error = (0, _api.errorText)(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = WebhookSettings;