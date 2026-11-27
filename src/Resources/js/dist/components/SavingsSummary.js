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
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _format = require("../services/format");
var _class, _class2, _descriptor;
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
var RANGE_DAYS = 30;

// What VideoOptimizer saves compared to serving the original files: smaller files, and (when the API has
// traffic data) the estimated bandwidth saved in the last 30 days and since the beginning. Purely
// informational, so a failed request simply hides the box.
var SavingsSummary = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function SavingsSummary() {
    var _this;
    _classCallCheck(this, SavingsSummary);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, SavingsSummary, [].concat(args));
    _initializerDefineProperty(_this, "savings", _descriptor, _this);
    _this._unmounted = false;
    return _this;
  }
  _inherits(SavingsSummary, _React$Component);
  return _createClass(SavingsSummary, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      (0, _api.getSavings)((0, _format.lastDaysRange)(RANGE_DAYS)).then((0, _mobx.action)(function (savings) {
        if (!_this2._unmounted) {
          _this2.savings = savings;
        }
      }))["catch"](function () {});
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._unmounted = true;
    }
  }, {
    key: "stat",
    value: function stat(label, value, hint) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-stat",
        key: label
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-stat__label"
      }, label), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-stat__value"
      }, value), hint && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-stat__hint"
      }, hint));
    }
  }, {
    key: "render",
    value: function render() {
      var savings = this.savings;
      var compression = savings && savings.compression;
      if (!savings || !compression || !compression.videos) {
        return null;
      }
      var stats = [this.stat((0, _utils.translate)('scale_videooptimizer.savings_videos'), String(compression.videos)), this.stat((0, _utils.translate)('scale_videooptimizer.savings_smaller'), (0, _format.formatPercent)(compression.reduced_percent) + ' %', (0, _format.formatBytes)(compression.original_bytes) + ' → ' + (0, _format.formatBytes)(compression.encoded_bytes))];
      if (savings.traffic_available) {
        if (savings.range) {
          stats.push(this.stat((0, _utils.translate)('scale_videooptimizer.savings_bandwidth_range', {
            days: RANGE_DAYS
          }), (0, _format.formatBytes)(savings.range.saved_bytes), (0, _format.formatPercent)(savings.range.saved_percent) + ' % ' + (0, _utils.translate)('scale_videooptimizer.savings_of_delivered', {
            delivered: (0, _format.formatBytes)(savings.range.delivered_bytes)
          })));
        }
        if (savings.all_time) {
          stats.push(this.stat((0, _utils.translate)('scale_videooptimizer.savings_bandwidth_all'), (0, _format.formatBytes)(savings.all_time.saved_bytes), (0, _format.formatPercent)(savings.all_time.saved_percent) + ' % ' + (0, _utils.translate)('scale_videooptimizer.savings_of_delivered', {
            delivered: (0, _format.formatBytes)(savings.all_time.delivered_bytes)
          })));
        }
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-savings"
      }, /*#__PURE__*/_react["default"].createElement("h2", {
        className: "vo-savings__title"
      }, (0, _utils.translate)('scale_videooptimizer.savings')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-stats"
      }, stats), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.savings_help')));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "savings", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _class2)) || _class;
var _default = exports["default"] = SavingsSummary;