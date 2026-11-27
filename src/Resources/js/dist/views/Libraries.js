"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.array.from.js");
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
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.filter.js");
require("core-js/modules/es.array.find.js");
require("core-js/modules/es.array.includes.js");
require("core-js/modules/es.array.is-array.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.join.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.array.some.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.set.js");
require("core-js/modules/es.string.includes.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.find.js");
require("core-js/modules/esnext.iterator.map.js");
require("core-js/modules/esnext.iterator.some.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _FolderList = _interopRequireDefault(require("sulu-admin-bundle/components/FolderList"));
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _permissions = require("../services/permissions");
var _format = require("../services/format");
var _SavingsSummary = _interopRequireDefault(require("../components/SavingsSummary"));
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
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
var CREATE_ID = '__new__';

// Splits a stored comma-separated ladder ("h264,h265") into a trimmed key array.
function splitKeys(value) {
  if (!value) {
    return [];
  }
  return value.split(',').map(function (key) {
    return key.trim();
  }).filter(Boolean);
}
function formatDate(value) {
  if (!value) {
    return '—';
  }
  var date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
var Libraries = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function Libraries() {
    var _this;
    _classCallCheck(this, Libraries);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, Libraries, [].concat(args));
    _initializerDefineProperty(_this, "loading", _descriptor, _this);
    _initializerDefineProperty(_this, "libraries", _descriptor2, _this);
    // {codecs: [{key,label,access,available}], resolutions: [...]} — org-wide encoding options.
    _initializerDefineProperty(_this, "encodings", _descriptor3, _this);
    // null = nothing selected; a library id = its cockpit; CREATE_ID = the "new library" form.
    _initializerDefineProperty(_this, "activeId", _descriptor4, _this);
    // Shared cockpit form state (create and edit).
    _initializerDefineProperty(_this, "formName", _descriptor5, _this);
    _initializerDefineProperty(_this, "formDescription", _descriptor6, _this);
    _initializerDefineProperty(_this, "selectedCodecs", _descriptor7, _this);
    _initializerDefineProperty(_this, "selectedResolutions", _descriptor8, _this);
    _initializerDefineProperty(_this, "formQuality", _descriptor9, _this);
    _initializerDefineProperty(_this, "saving", _descriptor0, _this);
    _initializerDefineProperty(_this, "error", _descriptor1, _this);
    _initializerDefineProperty(_this, "deleteId", _descriptor10, _this);
    _initializerDefineProperty(_this, "deleting", _descriptor11, _this);
    _initializerDefineProperty(_this, "reprocessId", _descriptor12, _this);
    _initializerDefineProperty(_this, "reprocessing", _descriptor13, _this);
    _initializerDefineProperty(_this, "reprocessResult", _descriptor14, _this);
    // "Re-encode all qualities" in the reprocess dialog; pre-ticked after the quality mode changed.
    _initializerDefineProperty(_this, "forceReprocess", _descriptor15, _this);
    _initializerDefineProperty(_this, "forceReprocessSuggestedFor", _descriptor16, _this);
    _initializerDefineProperty(_this, "selectLibrary", _descriptor17, _this);
    _initializerDefineProperty(_this, "startCreate", _descriptor18, _this);
    _initializerDefineProperty(_this, "handleNameChange", _descriptor19, _this);
    _initializerDefineProperty(_this, "handleDescriptionChange", _descriptor20, _this);
    _initializerDefineProperty(_this, "handleQualityChange", _descriptor21, _this);
    _initializerDefineProperty(_this, "toggleCodec", _descriptor22, _this);
    _initializerDefineProperty(_this, "toggleResolution", _descriptor23, _this);
    _initializerDefineProperty(_this, "save", _descriptor24, _this);
    _initializerDefineProperty(_this, "askDelete", _descriptor25, _this);
    _initializerDefineProperty(_this, "cancelDelete", _descriptor26, _this);
    _initializerDefineProperty(_this, "confirmDelete", _descriptor27, _this);
    _initializerDefineProperty(_this, "askReprocess", _descriptor28, _this);
    _initializerDefineProperty(_this, "toggleForceReprocess", _descriptor29, _this);
    _initializerDefineProperty(_this, "cancelReprocess", _descriptor30, _this);
    _initializerDefineProperty(_this, "confirmReprocess", _descriptor31, _this);
    return _this;
  }
  _inherits(Libraries, _React$Component);
  return _createClass(Libraries, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      (0, _api.getLibraries)().then((0, _mobx.action)(function (libraries) {
        _this2.libraries = libraries;
        _this2.loading = false;
      }))["catch"]((0, _mobx.action)(function (e) {
        _this2.loading = false;
        _this2.error = 428 === e.status ? (0, _utils.translate)('scale_videooptimizer.not_configured') : e.message || String(e);
      }));

      // Best-effort: the ladder pickers still work from stored keys if this fails.
      (0, _api.getEncodings)().then((0, _mobx.action)(function (encodings) {
        _this2.encodings = encodings;
      }))["catch"](function () {});
    }
  }, {
    key: "activeLibrary",
    get: function get() {
      var _this3 = this;
      if (!this.activeId || this.activeId === CREATE_ID) {
        return null;
      }
      return this.libraries.find(function (library) {
        return library.id === _this3.activeId;
      }) || null;
    }

    // A delivery-only library (media_managed === false) can't change its ladder or reprocess.
  }, {
    key: "mediaManaged",
    get: function get() {
      var library = this.activeLibrary;
      return !library || library.media_managed !== false;
    }
  }, {
    key: "ladderValue",
    value:
    // Joins the selected keys in the canonical option order (so the ladder stays meaningful
    // regardless of click order); unknown stored keys are appended in their original order.
    function ladderValue(group, selected) {
      var order = (this.encodings[group] || []).map(function (option) {
        return option.key;
      });
      var inOrder = order.filter(function (key) {
        return selected.includes(key);
      });
      var extras = selected.filter(function (key) {
        return !order.includes(key);
      });
      return [].concat(_toConsumableArray(inOrder), _toConsumableArray(extras)).join(',');
    }

    // True when the in-form ladder differs from the saved library — a reprocess is then needed.
  }, {
    key: "ladderChanged",
    value: function ladderChanged() {
      var library = this.activeLibrary;
      if (!library) {
        return false;
      }
      return this.ladderValue('codecs', this.selectedCodecs) !== (library.codec || '') || this.ladderValue('resolutions', this.selectedResolutions) !== (library.resolutions || '');
    }

    // True when the in-form quality mode differs from the saved library: finished renditions are
    // then only re-encoded by a forced reprocess.
  }, {
    key: "qualityChanged",
    value: function qualityChanged() {
      var library = this.activeLibrary;
      return !!library && (library.encoding_quality || 'performance') !== this.formQuality;
    }
  }, {
    key: "reload",
    value: function reload(selectId) {
      var _this4 = this;
      (0, _api.getLibraries)().then((0, _mobx.action)(function (libraries) {
        _this4.libraries = libraries;
        if (selectId && libraries.some(function (l) {
          return l.id === selectId;
        })) {
          _this4.selectLibrary(selectId);
        } else {
          _this4.activeId = null;
        }
      }))["catch"]((0, _mobx.action)(function (e) {
        _this4.error = e.message || String(e);
      }));
    }
  }, {
    key: "renderRail",
    value: function renderRail() {
      var _this5 = this;
      var folders = this.libraries.map(function (library) {
        return /*#__PURE__*/_react["default"].createElement(_FolderList["default"].Folder, {
          key: library.id,
          id: library.id,
          title: library.name,
          info: (library.id === _this5.activeId ? '✓ ' : '') + (0, _utils.translate)('scale_videooptimizer.library_videos_count', {
            count: library.video_count || 0
          })
        });
      });
      if ((0, _permissions.can)('libraries', 'add')) {
        folders.push(/*#__PURE__*/_react["default"].createElement(_FolderList["default"].Folder, {
          key: CREATE_ID,
          id: CREATE_ID,
          title: '＋ ' + (0, _utils.translate)('scale_videooptimizer.new_library'),
          info: ""
        }));
      }
      return /*#__PURE__*/_react["default"].createElement(_FolderList["default"], {
        onFolderClick: this.selectLibrary
      }, folders);
    }
  }, {
    key: "renderLadderGroup",
    value: function renderLadderGroup(group, availableKeys, selected, onToggle) {
      var options = this.encodings[group] || [];
      var known = new Set(options.map(function (option) {
        return option.key;
      }));
      var allowed = Array.isArray(availableKeys) && availableKeys.length ? availableKeys : null;
      var readOnly = !this.mediaManaged;
      // In edit mode the library's available_* list decides what's selectable; without it (or on
      // create) fall back to the org-wide "available" flag.
      var isSelectable = function isSelectable(option) {
        return allowed ? allowed.includes(option.key) : !!option.available;
      };

      // Preserve stored keys the encodings endpoint doesn't know about, so a save never drops them.
      var unknown = selected.filter(function (key) {
        return !known.has(key);
      });
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-chips"
      }, options.map(function (option) {
        var active = selected.includes(option.key);
        var selectable = isSelectable(option);
        var interactive = !readOnly && (selectable || active);
        var locked = !selectable && !active;
        var isAddon = option.access === 'addon';
        var classNames = ['vo-chip'];
        if (active) {
          classNames.push('vo-chip--active');
        }
        if (locked) {
          classNames.push('vo-chip--locked');
        }
        return /*#__PURE__*/_react["default"].createElement("button", {
          key: option.key,
          type: "button",
          className: classNames.join(' '),
          disabled: !interactive,
          title: isAddon && !option.available ? (0, _utils.translate)('scale_videooptimizer.addon_hint') : undefined,
          onClick: interactive ? function () {
            return onToggle(option.key);
          } : undefined
        }, option.label || option.key, isAddon && /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-chip-badge"
        }, (0, _utils.translate)('scale_videooptimizer.addon')));
      }), unknown.map(function (key) {
        return /*#__PURE__*/_react["default"].createElement("button", {
          key: key,
          type: "button",
          className: "vo-chip vo-chip--active",
          disabled: readOnly,
          onClick: readOnly ? undefined : function () {
            return onToggle(key);
          }
        }, key);
      }));
    }
  }, {
    key: "renderCockpit",
    value: function renderCockpit() {
      var isNew = this.activeId === CREATE_ID;
      var library = this.activeLibrary;
      var mediaManaged = this.mediaManaged;
      var canSave = (0, _permissions.can)('libraries', isNew ? 'add' : 'edit');
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-cockpit"
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-list-header"
      }, /*#__PURE__*/_react["default"].createElement("h1", null, isNew ? (0, _utils.translate)('scale_videooptimizer.new_library') : library ? library.name : ''), !isNew && (0, _permissions.can)('libraries', 'delete') && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.askDelete
      }, (0, _utils.translate)('scale_videooptimizer.delete'))), library && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-meta"
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-meta__row"
      }, /*#__PURE__*/_react["default"].createElement("dt", null, (0, _utils.translate)('scale_videooptimizer.videos_label')), /*#__PURE__*/_react["default"].createElement("dd", null, library.video_count || 0)), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-meta__row"
      }, /*#__PURE__*/_react["default"].createElement("dt", null, (0, _utils.translate)('scale_videooptimizer.library_storage')), /*#__PURE__*/_react["default"].createElement("dd", null, (0, _format.formatBytes)(library.storage_usage || 0))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-meta__row"
      }, /*#__PURE__*/_react["default"].createElement("dt", null, (0, _utils.translate)('scale_videooptimizer.created')), /*#__PURE__*/_react["default"].createElement("dd", null, formatDate(library.created_at))), !mediaManaged && /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-badge vo-badge--muted"
      }, (0, _utils.translate)('scale_videooptimizer.delivery_only'))), /*#__PURE__*/_react["default"].createElement("fieldset", {
        className: "vo-fieldset",
        disabled: !canSave
      }, /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.library_name')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        value: this.formName,
        onChange: this.handleNameChange
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.library_description')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        value: this.formDescription,
        onChange: this.handleDescriptionChange
      }), !mediaManaged ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '16px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.delivery_only_hint')) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.codecs')), this.renderLadderGroup('codecs', library ? library.available_codecs : null, this.selectedCodecs, this.toggleCodec), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.resolutions')), this.renderLadderGroup('resolutions', library ? library.available_resolutions : null, this.selectedResolutions, this.toggleResolution), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.encoding_quality')), /*#__PURE__*/_react["default"].createElement("select", {
        className: "vo-input",
        value: this.formQuality,
        onChange: this.handleQualityChange
      }, ['performance', 'quality'].map(function (value) {
        return /*#__PURE__*/_react["default"].createElement("option", {
          key: value,
          value: value
        }, (0, _utils.translate)('scale_videooptimizer.encoding_quality_' + value));
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.encoding_quality_help')), !isNew && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.encoding_quality_apply_note')), !isNew && (this.qualityChanged() || this.forceReprocessSuggestedFor === this.activeId) && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '12px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.quality_reprocess_hint')), !isNew && this.ladderChanged() && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '12px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.ladder_reprocess_hint')))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions"
      }, canSave && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "primary",
        onClick: this.save,
        loading: this.saving,
        disabled: !this.formName.trim()
      }, isNew ? (0, _utils.translate)('scale_videooptimizer.create') : (0, _utils.translate)('scale_videooptimizer.save')), !isNew && mediaManaged && (0, _permissions.can)('libraries', 'edit') && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.askReprocess
      }, (0, _utils.translate)('scale_videooptimizer.reprocess'))), this.reprocessResult && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--success"
      }, (0, _utils.translate)('scale_videooptimizer.reprocess_queued', {
        count: this.reprocessResult.queued
      })));
    }
  }, {
    key: "render",
    value: function render() {
      if (this.loading) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-page vo-page--wide"
        }, /*#__PURE__*/_react["default"].createElement(_components.Loader, null));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-page vo-page--wide"
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-list-header"
      }, /*#__PURE__*/_react["default"].createElement("h1", null, (0, _utils.translate)('scale_videooptimizer.libraries_nav'))), /*#__PURE__*/_react["default"].createElement(_SavingsSummary["default"], null), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-rail"
      }, this.renderRail()), /*#__PURE__*/_react["default"].createElement("hr", {
        className: "vo-divider"
      }), this.activeId ? this.renderCockpit() : /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-empty"
      }, (0, _utils.translate)('scale_videooptimizer.select_or_create_hint')), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        open: !!this.deleteId,
        title: (0, _utils.translate)('scale_videooptimizer.delete'),
        confirmText: (0, _utils.translate)('scale_videooptimizer.delete'),
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        onConfirm: this.confirmDelete,
        onCancel: this.cancelDelete,
        confirmLoading: this.deleting
      }, (0, _utils.translate)('scale_videooptimizer.confirm_delete_library')), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        open: !!this.reprocessId,
        title: (0, _utils.translate)('scale_videooptimizer.reprocess'),
        confirmText: (0, _utils.translate)('scale_videooptimizer.reprocess'),
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        onConfirm: this.confirmReprocess,
        onCancel: this.cancelReprocess,
        confirmLoading: this.reprocessing
      }, (0, _utils.translate)('scale_videooptimizer.confirm_reprocess'), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-check",
        style: {
          display: 'block',
          marginTop: '16px'
        }
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "checkbox",
        checked: this.forceReprocess,
        onChange: this.toggleForceReprocess
      }), (0, _utils.translate)('scale_videooptimizer.reprocess_force'))));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "libraries", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "encodings", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return {
      codecs: [],
      resolutions: []
    };
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "activeId", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "formName", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "formDescription", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "selectedCodecs", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "selectedResolutions", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "formQuality", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return 'performance';
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "saving", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "deleteId", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "deleting", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "reprocessId", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "reprocessing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "reprocessResult", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "forceReprocess", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "forceReprocessSuggestedFor", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _applyDecoratedDescriptor(_class2.prototype, "activeLibrary", [_mobx.computed], Object.getOwnPropertyDescriptor(_class2.prototype, "activeLibrary"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mediaManaged", [_mobx.computed], Object.getOwnPropertyDescriptor(_class2.prototype, "mediaManaged"), _class2.prototype), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "selectLibrary", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;
    return function (id) {
      if (id === CREATE_ID) {
        _this6.startCreate();
        return;
      }
      var library = _this6.libraries.find(function (l) {
        return l.id === id;
      });
      if (!library) {
        return;
      }
      _this6.activeId = library.id;
      _this6.formName = library.name || '';
      _this6.formDescription = library.description || '';
      _this6.selectedCodecs = splitKeys(library.codec);
      _this6.selectedResolutions = splitKeys(library.resolutions);
      _this6.formQuality = library.encoding_quality || 'performance';
      _this6.reprocessResult = null;
      _this6.error = null;
    };
  }
}), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "startCreate", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function () {
      _this7.activeId = CREATE_ID;
      _this7.formName = '';
      _this7.formDescription = '';
      _this7.selectedCodecs = [];
      _this7.selectedResolutions = [];
      _this7.formQuality = 'performance';
      _this7.reprocessResult = null;
      _this7.error = null;
    };
  }
}), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "handleNameChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function (event) {
      _this8.formName = event.target.value;
    };
  }
}), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "handleDescriptionChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function (event) {
      _this9.formDescription = event.target.value;
    };
  }
}), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "handleQualityChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function (event) {
      _this0.formQuality = event.target.value;
    };
  }
}), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "toggleCodec", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this1 = this;
    return function (key) {
      _this1.selectedCodecs = _this1.selectedCodecs.includes(key) ? _this1.selectedCodecs.filter(function (k) {
        return k !== key;
      }) : [].concat(_toConsumableArray(_this1.selectedCodecs), [key]);
    };
  }
}), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "toggleResolution", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this10 = this;
    return function (key) {
      _this10.selectedResolutions = _this10.selectedResolutions.includes(key) ? _this10.selectedResolutions.filter(function (k) {
        return k !== key;
      }) : [].concat(_toConsumableArray(_this10.selectedResolutions), [key]);
    };
  }
}), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "save", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this11 = this;
    return function () {
      var name = _this11.formName.trim();
      if (!name) {
        return;
      }
      _this11.saving = true;
      _this11.error = null;
      if (_this11.activeId === CREATE_ID) {
        var _payload = {
          name: name
        };
        var description = _this11.formDescription.trim();
        var codec = _this11.ladderValue('codecs', _this11.selectedCodecs);
        var resolutions = _this11.ladderValue('resolutions', _this11.selectedResolutions);
        // Omit empty optionals on create so we don't overwrite server defaults.
        if (description) {
          _payload.description = description;
        }
        // New libraries start with the API default (performance); only send a deliberate choice.
        if (_this11.formQuality !== 'performance') {
          _payload.encoding_quality = _this11.formQuality;
        }
        if (codec) {
          _payload.codec = codec;
        }
        if (resolutions) {
          _payload.resolutions = resolutions;
        }
        (0, _api.createLibrary)(_payload).then((0, _mobx.action)(function (created) {
          _this11.saving = false;
          _this11.reload(created && created.id);
        }))["catch"]((0, _mobx.action)(function (e) {
          _this11.saving = false;
          _this11.error = e.message || String(e);
        }));
        return;
      }

      // Edit: always send name/description (empty clears). The ladder is only writable on a
      // media-managed library; on a delivery-only one we leave it untouched.
      var payload = {
        name: name,
        description: _this11.formDescription.trim()
      };
      if (_this11.mediaManaged) {
        payload.codec = _this11.ladderValue('codecs', _this11.selectedCodecs);
        payload.resolutions = _this11.ladderValue('resolutions', _this11.selectedResolutions);
      }
      var id = _this11.activeId;
      var qualityChanged = _this11.mediaManaged && _this11.qualityChanged();
      // Only send the quality when the user changed it, never the displayed fallback value.
      if (qualityChanged) {
        payload.encoding_quality = _this11.formQuality;
      }
      (0, _api.updateLibrary)(id, payload).then((0, _mobx.action)(function () {
        _this11.saving = false;
        if (qualityChanged) {
          _this11.forceReprocessSuggestedFor = id;
        }
        _this11.reload(id);
      }))["catch"]((0, _mobx.action)(function (e) {
        _this11.saving = false;
        _this11.error = e.message || String(e);
      }));
    };
  }
}), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "askDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this12 = this;
    return function () {
      _this12.deleteId = _this12.activeId;
      _this12.error = null;
    };
  }
}), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "cancelDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this13 = this;
    return function () {
      _this13.deleteId = null;
    };
  }
}), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "confirmDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this14 = this;
    return function () {
      var id = _this14.deleteId;
      _this14.deleting = true;
      (0, _api.deleteLibrary)(id).then((0, _mobx.action)(function () {
        _this14.deleting = false;
        _this14.deleteId = null;
        _this14.reload(null);
      }))["catch"]((0, _mobx.action)(function (e) {
        _this14.deleting = false;
        _this14.deleteId = null;
        _this14.error = e.message || String(e);
      }));
    };
  }
}), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "askReprocess", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this15 = this;
    return function () {
      _this15.reprocessId = _this15.activeId;
      _this15.forceReprocess = _this15.forceReprocessSuggestedFor === _this15.activeId;
      _this15.reprocessResult = null;
      _this15.error = null;
    };
  }
}), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "toggleForceReprocess", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this16 = this;
    return function () {
      _this16.forceReprocess = !_this16.forceReprocess;
    };
  }
}), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "cancelReprocess", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this17 = this;
    return function () {
      _this17.reprocessId = null;
    };
  }
}), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "confirmReprocess", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this18 = this;
    return function () {
      var id = _this18.reprocessId;
      _this18.reprocessing = true;
      (0, _api.reprocessLibrary)(id, _this18.forceReprocess).then((0, _mobx.action)(function (result) {
        if (_this18.forceReprocess) {
          _this18.forceReprocessSuggestedFor = null;
        }
        _this18.reprocessing = false;
        _this18.reprocessId = null;
        _this18.reprocessResult = {
          queued: result && result.queued || 0
        };
      }))["catch"]((0, _mobx.action)(function (e) {
        _this18.reprocessing = false;
        _this18.reprocessId = null;
        _this18.error = e.message || String(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = Libraries;