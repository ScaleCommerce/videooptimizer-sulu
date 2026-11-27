"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.is-array.js");
require("core-js/modules/es.array.reduce.js");
require("core-js/modules/es.array.reverse.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.function.bind.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.create.js");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.set-prototype-of.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.test.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/esnext.iterator.for-each.js");
require("core-js/modules/esnext.iterator.reduce.js");
require("core-js/modules/web.dom-collections.for-each.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.filter.js");
require("core-js/modules/es.array.find.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.find.js");
require("core-js/modules/esnext.iterator.map.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
// Subtitles of one video: list with download/delete and an upload form (.srt or .vtt per language).
var VideoSubtitles = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function VideoSubtitles() {
    var _this;
    _classCallCheck(this, VideoSubtitles);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, VideoSubtitles, [].concat(args));
    _initializerDefineProperty(_this, "subtitles", _descriptor, _this);
    _initializerDefineProperty(_this, "languages", _descriptor2, _this);
    _initializerDefineProperty(_this, "loading", _descriptor3, _this);
    _initializerDefineProperty(_this, "busy", _descriptor4, _this);
    _initializerDefineProperty(_this, "error", _descriptor5, _this);
    _initializerDefineProperty(_this, "message", _descriptor6, _this);
    _initializerDefineProperty(_this, "language", _descriptor7, _this);
    _initializerDefineProperty(_this, "kind", _descriptor8, _this);
    _initializerDefineProperty(_this, "isDefault", _descriptor9, _this);
    _initializerDefineProperty(_this, "file", _descriptor0, _this);
    _this.fileInput = /*#__PURE__*/_react["default"].createRef();
    _this._unmounted = false;
    // Picking a language that already has a track pre-fills its kind and default flag, so replacing the file
    // does not silently change them.
    _initializerDefineProperty(_this, "selectLanguage", _descriptor1, _this);
    _this.handleLanguage = function (event) {
      _this.selectLanguage(event.target.value);
    };
    _initializerDefineProperty(_this, "handleKind", _descriptor10, _this);
    _initializerDefineProperty(_this, "toggleDefault", _descriptor11, _this);
    _initializerDefineProperty(_this, "handleFile", _descriptor12, _this);
    _initializerDefineProperty(_this, "upload", _descriptor13, _this);
    _initializerDefineProperty(_this, "remove", _descriptor14, _this);
    return _this;
  }
  _inherits(VideoSubtitles, _React$Component);
  return _createClass(VideoSubtitles, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      Promise.all([(0, _api.getSubtitles)(this.props.uuid), (0, _api.getSubtitleLanguages)()]).then((0, _mobx.action)(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          subtitles = _ref2[0],
          languages = _ref2[1];
        if (_this2._unmounted) {
          return;
        }
        _this2.subtitles = subtitles;
        _this2.languages = languages;
        _this2.selectLanguage(languages.length > 0 ? languages[0].code : '');
        _this2.loading = false;
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this2._unmounted) {
          return;
        }
        _this2.loading = false;
        _this2.error = (0, _api.errorText)(e);
      }));
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._unmounted = true;
    }
  }, {
    key: "renderList",
    value: function renderList() {
      var _this3 = this;
      if (this.subtitles.length === 0) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-hint"
        }, (0, _utils.translate)('scale_videooptimizer.no_subtitles'));
      }
      return /*#__PURE__*/_react["default"].createElement("ul", {
        className: "vo-subtitles"
      }, this.subtitles.map(function (subtitle) {
        return /*#__PURE__*/_react["default"].createElement("li", {
          key: subtitle.language,
          className: "vo-subtitles__item"
        }, /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-subtitles__name"
        }, subtitle.label || subtitle.language, " ", /*#__PURE__*/_react["default"].createElement("code", null, subtitle.language)), /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-subtitles__meta"
        }, (0, _utils.translate)('scale_videooptimizer.subtitle_kind_' + (subtitle.kind || 'subtitles')), subtitle.is_default ? ' · ' + (0, _utils.translate)('scale_videooptimizer.subtitle_default') : '', typeof subtitle.cue_count === 'number' ? ' · ' + (0, _utils.translate)('scale_videooptimizer.subtitle_cues', {
          count: subtitle.cue_count
        }) : ''), /*#__PURE__*/_react["default"].createElement("a", {
          className: "vo-subtitles__link",
          href: (0, _api.subtitleDownloadUrl)(_this3.props.uuid, subtitle.language),
          download: true
        }, (0, _utils.translate)('scale_videooptimizer.subtitle_download')), /*#__PURE__*/_react["default"].createElement(_components.Button, {
          skin: "link",
          disabled: _this3.busy,
          onClick: function onClick() {
            return _this3.remove(subtitle.language);
          }
        }, (0, _utils.translate)('scale_videooptimizer.delete')));
      }));
    }
  }, {
    key: "renderForm",
    value: function renderForm() {
      if (this.languages.length === 0) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-hint"
        }, (0, _utils.translate)('scale_videooptimizer.subtitle_languages_missing'));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions",
        style: {
          marginTop: 0,
          alignItems: 'center',
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/_react["default"].createElement("select", {
        className: "vo-input vo-input--auto",
        value: this.language,
        onChange: this.handleLanguage,
        disabled: this.busy
      }, this.languages.map(function (language) {
        return /*#__PURE__*/_react["default"].createElement("option", {
          key: language.code,
          value: language.code
        }, language.label || language.code, " (", language.code, ")");
      })), /*#__PURE__*/_react["default"].createElement("select", {
        className: "vo-input vo-input--auto",
        value: this.kind,
        onChange: this.handleKind,
        disabled: this.busy
      }, /*#__PURE__*/_react["default"].createElement("option", {
        value: "subtitles"
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_kind_subtitles')), /*#__PURE__*/_react["default"].createElement("option", {
        value: "captions"
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_kind_captions'))), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-check"
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "checkbox",
        checked: this.isDefault,
        onChange: this.toggleDefault,
        disabled: this.busy
      }), (0, _utils.translate)('scale_videooptimizer.subtitle_default')), /*#__PURE__*/_react["default"].createElement("input", {
        ref: this.fileInput,
        type: "file",
        accept: ".srt,.vtt,text/vtt",
        disabled: this.busy,
        onChange: this.handleFile
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.upload,
        loading: this.busy,
        disabled: !this.file
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_upload')));
    }
  }, {
    key: "render",
    value: function render() {
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-subtitles-section"
      }, /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.subtitles')), this.loading ? null : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, this.renderList(), this.renderForm(), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.subtitle_help'))), this.message && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--success"
      }, this.message), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "subtitles", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "languages", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "message", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "language", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "kind", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return 'subtitles';
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "isDefault", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "file", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "selectLanguage", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this4 = this;
    return function (code) {
      _this4.language = code;
      var existing = _this4.subtitles.find(function (subtitle) {
        return subtitle.language === code;
      });
      _this4.kind = existing && existing.kind ? existing.kind : 'subtitles';
      _this4.isDefault = !!(existing && existing.is_default);
    };
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "handleKind", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this5 = this;
    return function (event) {
      _this5.kind = event.target.value;
    };
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "toggleDefault", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;
    return function () {
      _this6.isDefault = !_this6.isDefault;
    };
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "handleFile", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function (event) {
      _this7.file = event.target.files && event.target.files[0] || null;
    };
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "upload", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function () {
      if (!_this8.file || !_this8.language) {
        return;
      }
      _this8.busy = true;
      _this8.error = null;
      _this8.message = null;
      (0, _api.uploadSubtitle)(_this8.props.uuid, {
        file: _this8.file,
        language: _this8.language,
        kind: _this8.kind,
        isDefault: _this8.isDefault
      }).then(function (result) {
        return (0, _api.getSubtitles)(_this8.props.uuid).then(function (subtitles) {
          return {
            result: result,
            subtitles: subtitles
          };
        });
      }).then((0, _mobx.action)(function (_ref3) {
        var result = _ref3.result,
          subtitles = _ref3.subtitles;
        if (_this8._unmounted) {
          return;
        }
        _this8.busy = false;
        _this8.subtitles = subtitles;
        _this8.file = null;
        _this8.selectLanguage(_this8.language);
        if (_this8.fileInput.current) {
          _this8.fileInput.current.value = '';
        }
        var skipped = result && result.skipped_cues;
        _this8.message = skipped ? (0, _utils.translate)('scale_videooptimizer.subtitle_saved_skipped', {
          count: skipped
        }) : (0, _utils.translate)('scale_videooptimizer.subtitle_saved');
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this8._unmounted) {
          return;
        }
        _this8.busy = false;
        _this8.error = (0, _api.errorText)(e);
      }));
    };
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "remove", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function (language) {
      _this9.busy = true;
      _this9.error = null;
      _this9.message = null;
      (0, _api.deleteSubtitle)(_this9.props.uuid, language).then((0, _mobx.action)(function () {
        if (_this9._unmounted) {
          return;
        }
        _this9.busy = false;
        _this9.subtitles = _this9.subtitles.filter(function (subtitle) {
          return subtitle.language !== language;
        });
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this9._unmounted) {
          return;
        }
        _this9.busy = false;
        _this9.error = (0, _api.errorText)(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = VideoSubtitles;