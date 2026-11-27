"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.is-array.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.reduce.js");
require("core-js/modules/es.array.reverse.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.function.bind.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.create.js");
require("core-js/modules/es.object.define-properties.js");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.object.get-own-property-descriptors.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.set-prototype-of.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.test.js");
require("core-js/modules/es.regexp.to-string.js");
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
require("core-js/modules/es.array.join.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.number.is-nan.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.parse-int.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.string.pad-start.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.map.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _utils = require("sulu-admin-bundle/utils");
var _stores = require("sulu-admin-bundle/stores");
var _VideoSubtitles = _interopRequireDefault(require("./VideoSubtitles"));
var _SingleMediaSelectionOverlay = _interopRequireDefault(require("sulu-media-bundle/containers/SingleMediaSelectionOverlay"));
var _api = require("../services/api");
var _videoMeta = require("../services/videoMeta");
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
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
// Poster processing takes seconds; stop polling after ~3 minutes.
var POSTER_POLL_ATTEMPTS = 60;

// Formats a duration in seconds as m:ss (e.g. 83 -> "1:23").
function formatDuration(seconds) {
  var total = Math.max(0, Math.round(seconds));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

// Formats an ISO timestamp as a localized date, or '' when unparseable.
function formatDate(iso) {
  var date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}
var VideoDetail = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function VideoDetail() {
    var _this;
    _classCallCheck(this, VideoDetail);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, VideoDetail, [].concat(args));
    _initializerDefineProperty(_this, "video", _descriptor, _this);
    _initializerDefineProperty(_this, "thumbnails", _descriptor2, _this);
    _initializerDefineProperty(_this, "title", _descriptor3, _this);
    _initializerDefineProperty(_this, "options", _descriptor4, _this);
    _initializerDefineProperty(_this, "tagsText", _descriptor5, _this);
    _initializerDefineProperty(_this, "knownTags", _descriptor6, _this);
    _initializerDefineProperty(_this, "metadata", _descriptor7, _this);
    _initializerDefineProperty(_this, "busy", _descriptor8, _this);
    // null | 'save' | 'thumb' | 'poster' | 'delete'
    _initializerDefineProperty(_this, "status", _descriptor9, _this);
    _initializerDefineProperty(_this, "error", _descriptor0, _this);
    _initializerDefineProperty(_this, "confirmDelete", _descriptor1, _this);
    _initializerDefineProperty(_this, "mediaOverlayOpen", _descriptor10, _this);
    _initializerDefineProperty(_this, "playing", _descriptor11, _this);
    // Locale for Sulu's media selection overlay: use the form's locale when embedded in a field,
    // otherwise fall back to the user's current content locale (standalone videos view).
    _this.mediaLocale = _this.props.locale || _mobx.observable.box(_stores.userStore.contentLocale);
    // Plain (non-observable) flag — guards async continuations after unmount, no @action needed.
    _this._unmounted = false;
    _initializerDefineProperty(_this, "play", _descriptor12, _this);
    _initializerDefineProperty(_this, "refresh", _descriptor13, _this);
    _initializerDefineProperty(_this, "handleTitleChange", _descriptor14, _this);
    _initializerDefineProperty(_this, "toggleOption", _descriptor15, _this);
    _initializerDefineProperty(_this, "handleTagsChange", _descriptor16, _this);
    _initializerDefineProperty(_this, "handleMetadataChange", _descriptor17, _this);
    _initializerDefineProperty(_this, "addMetadataRow", _descriptor18, _this);
    _initializerDefineProperty(_this, "removeMetadataRow", _descriptor19, _this);
    _initializerDefineProperty(_this, "save", _descriptor20, _this);
    _initializerDefineProperty(_this, "pickThumbnail", _descriptor21, _this);
    // Re-activates the already-uploaded custom poster (source='custom') so the editor can switch
    // back to it after picking a generated thumbnail — without re-uploading.
    _initializerDefineProperty(_this, "pickCustomPoster", _descriptor22, _this);
    _this.handlePosterFile = function (event) {
      var file = event.target.files && event.target.files[0];
      if (file) {
        _this.uploadPosterBlob(file);
      }
    };
    _initializerDefineProperty(_this, "openMediaOverlay", _descriptor23, _this);
    _initializerDefineProperty(_this, "closeMediaOverlay", _descriptor24, _this);
    // Picks an image from the Sulu media library and uploads it as the custom poster: the browser
    // fetches the (same-origin) media file and feeds it through the presigned poster pipeline.
    _initializerDefineProperty(_this, "handleMediaSelect", _descriptor25, _this);
    // Runs the presigned custom-poster pipeline for any File/Blob; the API activates it once processed.
    _initializerDefineProperty(_this, "uploadPosterBlob", _descriptor26, _this);
    _initializerDefineProperty(_this, "removeCustomPoster", _descriptor27, _this);
    _initializerDefineProperty(_this, "askDelete", _descriptor28, _this);
    _initializerDefineProperty(_this, "cancelDelete", _descriptor29, _this);
    _initializerDefineProperty(_this, "doDelete", _descriptor30, _this);
    return _this;
  }
  _inherits(VideoDetail, _React$Component);
  return _createClass(VideoDetail, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      this.loadThumbnails();
      // Existing tags are only suggestions: a failed lookup must not get in the editor's way.
      (0, _api.getTags)().then((0, _mobx.action)(function (tags) {
        if (!_this2._unmounted) {
          _this2.knownTags = tags;
        }
      }))["catch"](function () {});
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._unmounted = true;
    }
  }, {
    key: "loadThumbnails",
    value: function loadThumbnails() {
      var _this3 = this;
      (0, _api.getThumbnails)(this.video.uuid).then((0, _mobx.action)(function (thumbnails) {
        if (_this3._unmounted) {
          return;
        }
        _this3.thumbnails = thumbnails;
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this3._unmounted) {
          return;
        }
        _this3.error = e.message || String(e);
      }));
    }
  }, {
    key: "renderPlayer",
    value:
    // Shows the video's current poster with a play button; clicking embeds the actual VideoOptimizer
    // player. The poster is our own cache-busted <img>, so switching a thumbnail/poster is reflected
    // here immediately — unlike the embed iframe, which keeps the CDN-cached poster until played.
    // Sized to the video's own aspect ratio (so portrait reels are not letterboxed).
    function renderPlayer() {
      var parts = (typeof this.video.resolution === 'string' ? this.video.resolution : '').split('x');
      var width = parseInt(parts[0], 10);
      var height = parseInt(parts[1], 10);
      var ratio = width > 0 && height > 0 ? [width, height] : [16, 9];
      var maxWidth = Math.min(640, Math.round(400 * ratio[0] / ratio[1]));
      var poster = (0, _api.posterFor)(this.video);
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-detail__player",
        style: {
          aspectRatio: ratio[0] + ' / ' + ratio[1],
          maxWidth: maxWidth + 'px'
        }
      }, this.playing ? /*#__PURE__*/_react["default"].createElement("iframe", {
        src: (this.video.embed_url || 'https://player.videooptimizer.eu/embed/' + this.video.uuid) + '?autoplay=1',
        title: this.video.title || 'Video',
        allow: "autoplay; fullscreen; picture-in-picture",
        allowFullScreen: true
      }) : /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: "vo-detail__play",
        onClick: this.play,
        "aria-label": (0, _utils.translate)('scale_videooptimizer.use_video')
      }, poster ? /*#__PURE__*/_react["default"].createElement("img", {
        src: (0, _api.bustCache)(poster),
        alt: ""
      }) : /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-video-ph"
      }, "\u25B6"), /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-detail__play-icon",
        "aria-hidden": "true"
      }, "\u25B6")));
    }

    // Read-only facts about the video (dimensions, duration, status, views, created date).
  }, {
    key: "renderMeta",
    value: function renderMeta() {
      var v = this.video;
      var rows = [];
      if (v.resolution) {
        rows.push([(0, _utils.translate)('scale_videooptimizer.dimensions'), v.resolution]);
      }
      if (typeof v.duration === 'number') {
        rows.push([(0, _utils.translate)('scale_videooptimizer.duration'), formatDuration(v.duration)]);
      }
      if (v.status) {
        rows.push([(0, _utils.translate)('scale_videooptimizer.status'), (0, _utils.translate)('scale_videooptimizer.status_' + v.status)]);
      }
      if (v.status === 'failed' && typeof v.error === 'string' && v.error.trim()) {
        rows.push([(0, _utils.translate)('scale_videooptimizer.failure_reason'), v.error.trim()]);
      }
      if (typeof v.views === 'number') {
        rows.push([(0, _utils.translate)('scale_videooptimizer.views'), String(v.views)]);
      }
      if (v.created_at) {
        rows.push([(0, _utils.translate)('scale_videooptimizer.created'), formatDate(v.created_at)]);
      }
      if (rows.length === 0) {
        return null;
      }
      return /*#__PURE__*/_react["default"].createElement("dl", {
        className: "vo-meta"
      }, rows.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          label = _ref2[0],
          value = _ref2[1];
        return /*#__PURE__*/_react["default"].createElement("div", {
          key: label,
          className: "vo-meta__row"
        }, /*#__PURE__*/_react["default"].createElement("dt", null, label), /*#__PURE__*/_react["default"].createElement("dd", null, value));
      }));
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;
      var source = this.video.poster && this.video.poster.source;
      var customStatus = this.video.poster && this.video.poster.custom_status;
      var customUrl = this.video.poster && this.video.poster.custom_url;
      var hasCustomPoster = customStatus === 'ready' && !!customUrl;
      var OPTION_KEYS = ['responsive', 'autoplay', 'preload', 'loop', 'muted'];
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-detail"
      }, this.renderPlayer(), this.renderMeta(), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.thumbnails')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-thumbs"
      }, hasCustomPoster && /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: 'vo-thumb vo-thumb--custom' + (source === 'custom' ? ' vo-thumb--active' : ''),
        disabled: this.busy === 'thumb',
        title: (0, _utils.translate)('scale_videooptimizer.poster_source_custom'),
        onClick: this.pickCustomPoster
      }, /*#__PURE__*/_react["default"].createElement("img", {
        src: (0, _api.bustCache)(customUrl),
        alt: (0, _utils.translate)('scale_videooptimizer.poster_source_custom')
      }), /*#__PURE__*/_react["default"].createElement("span", {
        className: "vo-thumb-badge"
      }, (0, _utils.translate)('scale_videooptimizer.poster_source_custom'))), this.thumbnails.map(function (t) {
        return /*#__PURE__*/_react["default"].createElement("button", {
          key: t.index,
          type: "button",
          className: "vo-thumb",
          disabled: _this4.busy === 'thumb',
          onClick: function onClick() {
            return _this4.pickThumbnail(t.index);
          }
        }, /*#__PURE__*/_react["default"].createElement("img", {
          src: (0, _api.bustCache)(t.url),
          alt: '#' + t.index
        }));
      })), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.custom_poster')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions",
        style: {
          marginTop: 0,
          alignItems: 'center'
        }
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        disabled: this.busy === 'poster',
        onChange: this.handlePosterFile
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.openMediaOverlay,
        disabled: this.busy === 'poster'
      }, (0, _utils.translate)('scale_videooptimizer.choose_from_media')), hasCustomPoster && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.removeCustomPoster
      }, (0, _utils.translate)('scale_videooptimizer.remove_custom_poster'))), this.status && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-upload-status"
      }, this.status), /*#__PURE__*/_react["default"].createElement(_SingleMediaSelectionOverlay["default"], {
        open: this.mediaOverlayOpen,
        locale: this.mediaLocale,
        types: ['image'],
        onClose: this.closeMediaOverlay,
        onConfirm: this.handleMediaSelect
      }), /*#__PURE__*/_react["default"].createElement(_VideoSubtitles["default"], {
        uuid: this.video.uuid
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('sulu_admin.title')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        value: this.title,
        onChange: this.handleTitleChange
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.tags')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        list: "vo-known-tags",
        value: this.tagsText,
        placeholder: (0, _utils.translate)('scale_videooptimizer.tags_placeholder'),
        onChange: this.handleTagsChange
      }), /*#__PURE__*/_react["default"].createElement("datalist", {
        id: "vo-known-tags"
      }, this.knownTags.map(function (tag) {
        return /*#__PURE__*/_react["default"].createElement("option", {
          key: tag.name,
          value: tag.name
        });
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.tags_help')), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.metadata')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-metadata"
      }, this.metadata.map(function (row, index) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          key: index,
          className: "vo-metadata__row"
        }, /*#__PURE__*/_react["default"].createElement("input", {
          type: "text",
          className: "vo-input vo-input--auto",
          placeholder: (0, _utils.translate)('scale_videooptimizer.metadata_key'),
          value: row.key,
          onChange: function onChange(event) {
            return _this4.handleMetadataChange(index, 'key', event.target.value);
          }
        }), /*#__PURE__*/_react["default"].createElement("input", {
          type: "text",
          className: "vo-input vo-input--auto",
          placeholder: (0, _utils.translate)('scale_videooptimizer.metadata_value'),
          value: row.value,
          onChange: function onChange(event) {
            return _this4.handleMetadataChange(index, 'value', event.target.value);
          }
        }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
          skin: "link",
          onClick: function onClick() {
            return _this4.removeMetadataRow(index);
          }
        }, (0, _utils.translate)('scale_videooptimizer.remove_video')));
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.addMetadataRow,
        disabled: this.metadata.length >= _videoMeta.MAX_METADATA
      }, (0, _utils.translate)('scale_videooptimizer.metadata_add'))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.metadata_help')), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.player_options')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-option-checks"
      }, OPTION_KEYS.map(function (key) {
        return /*#__PURE__*/_react["default"].createElement("label", {
          key: key,
          className: "vo-check"
        }, /*#__PURE__*/_react["default"].createElement("input", {
          type: "checkbox",
          checked: !!_this4.options[key],
          onChange: function onChange() {
            return _this4.toggleOption(key);
          }
        }), (0, _utils.translate)('scale_videooptimizer.option_' + key));
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "primary",
        onClick: this.save,
        loading: this.busy === 'save'
      }, (0, _utils.translate)('sulu_admin.save')), this.props.onUse && /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "primary",
        onClick: function onClick() {
          return _this4.props.onUse(_this4.video);
        }
      }, (0, _utils.translate)('scale_videooptimizer.use_video')), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "link",
        onClick: this.askDelete
      }, (0, _utils.translate)('scale_videooptimizer.delete'))), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error), /*#__PURE__*/_react["default"].createElement(_components.Dialog, {
        open: this.confirmDelete,
        title: (0, _utils.translate)('scale_videooptimizer.delete'),
        confirmText: (0, _utils.translate)('scale_videooptimizer.delete'),
        cancelText: (0, _utils.translate)('sulu_admin.cancel'),
        onConfirm: this.doDelete,
        onCancel: this.cancelDelete,
        confirmLoading: this.busy === 'delete'
      }, (0, _utils.translate)('scale_videooptimizer.confirm_delete_video')));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "video", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return this.props.video;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "thumbnails", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "title", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return this.props.video.title || '';
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "options", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return _objectSpread({}, this.props.video.options || {});
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "tagsText", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return (this.props.video.tags || []).join(', ');
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "knownTags", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "metadata", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return (0, _videoMeta.metadataRows)(this.props.video.metadata);
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "status", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "confirmDelete", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "mediaOverlayOpen", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "playing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "play", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this5 = this;
    return function () {
      _this5.playing = true;
    };
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "refresh", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;
    return function (video) {
      // The stable poster/thumbnail CDN URLs are cached; bump the cache-buster so the preview
      // reflects the just-changed image instead of the browser's stale copy.
      (0, _api.bumpCacheBust)();
      // Drop back to the (updated) poster so a just-changed thumbnail is visible immediately.
      _this6.playing = false;
      _this6.video = video;
      if (_this6.props.onChanged) {
        _this6.props.onChanged(video);
      }
    };
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "handleTitleChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function (event) {
      _this7.title = event.target.value;
    };
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "toggleOption", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function (key) {
      _this8.options = _objectSpread(_objectSpread({}, _this8.options), {}, _defineProperty({}, key, !_this8.options[key]));
    };
  }
}), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "handleTagsChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function (event) {
      _this9.tagsText = event.target.value;
    };
  }
}), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "handleMetadataChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function (index, field, value) {
      _this0.metadata = _this0.metadata.map(function (row, i) {
        return i === index ? _objectSpread(_objectSpread({}, row), {}, _defineProperty({}, field, value)) : row;
      });
    };
  }
}), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "addMetadataRow", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this1 = this;
    return function () {
      _this1.metadata = _this1.metadata.concat([{
        key: '',
        value: ''
      }]);
    };
  }
}), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "removeMetadataRow", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this10 = this;
    return function (index) {
      _this10.metadata = _this10.metadata.filter(function (row, i) {
        return i !== index;
      });
    };
  }
}), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "save", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this11 = this;
    return function () {
      var tags = (0, _videoMeta.parseTags)(_this11.tagsText);
      var problem = (0, _videoMeta.validateTags)(tags) || (0, _videoMeta.validateMetadata)(_this11.metadata);
      if (problem) {
        _this11.error = (0, _utils.translate)(problem);
        return;
      }
      // Tags replace the whole set and metadata is merged by the API: send only what changed.
      var payload = {
        title: _this11.title,
        option: _this11.options
      };
      if (!(0, _videoMeta.sameTags)(tags, _this11.video.tags || [])) {
        payload.tags = tags;
      }
      var patch = (0, _videoMeta.metadataPatch)(_this11.video.metadata, _this11.metadata);
      if (patch) {
        payload.metadata = patch;
      }
      _this11.busy = 'save';
      _this11.error = null;
      (0, _api.updateVideo)(_this11.video.uuid, payload).then((0, _mobx.action)(function (video) {
        if (_this11._unmounted) {
          return;
        }
        _this11.busy = null;
        _this11.tagsText = (video.tags || []).join(', ');
        _this11.metadata = (0, _videoMeta.metadataRows)(video.metadata);
        _this11.refresh(video);
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this11._unmounted) {
          return;
        }
        _this11.busy = null;
        _this11.error = e.message || String(e);
      }));
    };
  }
}), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "pickThumbnail", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this12 = this;
    return function (index) {
      _this12.busy = 'thumb';
      _this12.error = null;
      (0, _api.selectThumbnail)(_this12.video.uuid, index).then(function () {
        return (0, _api.pollVideo)(_this12.video.uuid, function (v) {
          return (v.poster && v.poster.source) === 'thumbnail';
        }, {
          maxAttempts: POSTER_POLL_ATTEMPTS
        });
      }).then((0, _mobx.action)(function (video) {
        if (_this12._unmounted) {
          return;
        }
        _this12.busy = null;
        _this12.refresh(video);
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this12._unmounted) {
          return;
        }
        _this12.busy = null;
        _this12.error = e.message || String(e);
      }));
    };
  }
}), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "pickCustomPoster", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this13 = this;
    return function () {
      _this13.busy = 'thumb';
      _this13.error = null;
      (0, _api.selectPoster)(_this13.video.uuid, {
        source: 'custom'
      }).then(function () {
        return (0, _api.pollVideo)(_this13.video.uuid, function (v) {
          return (v.poster && v.poster.source) === 'custom';
        }, {
          maxAttempts: POSTER_POLL_ATTEMPTS
        });
      }).then((0, _mobx.action)(function (video) {
        if (_this13._unmounted) {
          return;
        }
        _this13.busy = null;
        _this13.refresh(video);
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this13._unmounted) {
          return;
        }
        _this13.busy = null;
        _this13.error = e.message || String(e);
      }));
    };
  }
}), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "openMediaOverlay", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this14 = this;
    return function () {
      _this14.mediaOverlayOpen = true;
    };
  }
}), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "closeMediaOverlay", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this15 = this;
    return function () {
      _this15.mediaOverlayOpen = false;
    };
  }
}), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "handleMediaSelect", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this16 = this;
    return function (media) {
      _this16.mediaOverlayOpen = false;
      if (!media || !media.url) {
        return;
      }
      _this16.busy = 'poster';
      _this16.error = null;
      _this16.status = (0, _utils.translate)('scale_videooptimizer.uploading');
      fetch(media.url, {
        credentials: 'same-origin'
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Could not load media (' + response.status + ')');
        }
        return response.blob();
      }).then(function (blob) {
        var type = (0, _api.posterContentType)(blob.type, media);
        if (!type) {
          throw new Error((0, _utils.translate)('scale_videooptimizer.poster_unsupported_type'));
        }
        return _this16.uploadPosterBlob(type === blob.type ? blob : new Blob([blob], {
          type: type
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        if (_this16._unmounted) {
          return;
        }
        _this16.busy = null;
        _this16.status = null;
        _this16.error = e.message || String(e);
      }));
    };
  }
}), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "uploadPosterBlob", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this17 = this;
    return function (blob) {
      _this17.busy = 'poster';
      _this17.error = null;
      _this17.status = (0, _utils.translate)('scale_videooptimizer.uploading');
      (0, _api.initiatePosterUpload)(_this17.video.uuid, {
        contentType: blob.type,
        fileSize: blob.size
      }).then(function (data) {
        return (0, _api.uploadPoster)(data.uploadUrl, blob).then(function () {
          return (0, _api.completePosterUpload)(_this17.video.uuid, data.key);
        });
      }).then((0, _mobx.action)(function () {
        if (_this17._unmounted) {
          return;
        }
        _this17.status = (0, _utils.translate)('scale_videooptimizer.processing');
      })).then(function () {
        return (0, _api.pollVideo)(_this17.video.uuid, function (v) {
          var status = v.poster && v.poster.custom_status;
          return status === 'ready' || status === 'failed';
        }, {
          maxAttempts: POSTER_POLL_ATTEMPTS
        });
      }).then(function (video) {
        if (video.poster && video.poster.custom_status === 'failed') {
          throw new Error((0, _utils.translate)('scale_videooptimizer.poster_failed'));
        }
        // A processed custom poster normally becomes the active one on its own. Only if it did
        // not, activate it once explicitly.
        if ((video.poster && video.poster.source) === 'custom') {
          return video;
        }
        return (0, _api.selectPoster)(_this17.video.uuid, {
          source: 'custom'
        }).then(function () {
          return (0, _api.pollVideo)(_this17.video.uuid, function (v) {
            return (v.poster && v.poster.source) === 'custom';
          }, {
            maxAttempts: POSTER_POLL_ATTEMPTS
          });
        });
      }).then((0, _mobx.action)(function (video) {
        if (_this17._unmounted) {
          return;
        }
        _this17.busy = null;
        _this17.status = null;
        _this17.refresh(video);
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this17._unmounted) {
          return;
        }
        _this17.busy = null;
        _this17.status = null;
        _this17.error = e.message || String(e);
      }));
    };
  }
}), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "removeCustomPoster", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this18 = this;
    return function () {
      _this18.busy = 'poster';
      _this18.error = null;
      (0, _api.deletePoster)(_this18.video.uuid).then(function () {
        return (0, _api.pollVideo)(_this18.video.uuid, function (v) {
          return (v.poster && v.poster.source) !== 'custom';
        }, {
          maxAttempts: POSTER_POLL_ATTEMPTS
        });
      }).then((0, _mobx.action)(function (video) {
        if (_this18._unmounted) {
          return;
        }
        _this18.busy = null;
        _this18.refresh(video);
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this18._unmounted) {
          return;
        }
        _this18.busy = null;
        _this18.error = e.message || String(e);
      }));
    };
  }
}), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "askDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this19 = this;
    return function () {
      _this19.confirmDelete = true;
    };
  }
}), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "cancelDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this20 = this;
    return function () {
      _this20.confirmDelete = false;
    };
  }
}), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "doDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this21 = this;
    return function () {
      _this21.busy = 'delete';
      (0, _api.deleteVideo)(_this21.video.uuid).then((0, _mobx.action)(function () {
        if (_this21._unmounted) {
          return;
        }
        _this21.busy = null;
        _this21.confirmDelete = false;
        if (_this21.props.onDeleted) {
          _this21.props.onDeleted();
        }
      }))["catch"]((0, _mobx.action)(function (e) {
        if (_this21._unmounted) {
          return;
        }
        _this21.busy = null;
        _this21.confirmDelete = false;
        _this21.error = e.message || String(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = VideoDetail;