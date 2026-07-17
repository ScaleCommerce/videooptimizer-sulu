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
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.find.js");
require("core-js/modules/esnext.iterator.map.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _FolderList = _interopRequireDefault(require("sulu-admin-bundle/components/FolderList"));
var _containers = require("sulu-admin-bundle/containers");
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _VideoDetail = _interopRequireDefault(require("../components/VideoDetail"));
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21;
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
var Videos = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function Videos() {
    var _this;
    _classCallCheck(this, Videos);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, Videos, [].concat(args));
    _initializerDefineProperty(_this, "loading", _descriptor, _this);
    _initializerDefineProperty(_this, "loadingVideos", _descriptor2, _this);
    _initializerDefineProperty(_this, "libraries", _descriptor3, _this);
    // null = show videos from every library; a library id = filter to that library.
    _initializerDefineProperty(_this, "activeLibraryId", _descriptor4, _this);
    _initializerDefineProperty(_this, "videos", _descriptor5, _this);
    _initializerDefineProperty(_this, "selected", _descriptor6, _this);
    _initializerDefineProperty(_this, "error", _descriptor7, _this);
    _initializerDefineProperty(_this, "uploading", _descriptor8, _this);
    _initializerDefineProperty(_this, "uploadStatus", _descriptor9, _this);
    _initializerDefineProperty(_this, "ingestSourceUrl", _descriptor0, _this);
    _initializerDefineProperty(_this, "ingestTitle", _descriptor1, _this);
    _initializerDefineProperty(_this, "ingesting", _descriptor10, _this);
    _initializerDefineProperty(_this, "ingestStatus", _descriptor11, _this);
    // Hidden file input driven by the toolbar "upload" button (Sulu media pattern).
    _this.fileInputRef = /*#__PURE__*/_react["default"].createRef();
    _initializerDefineProperty(_this, "selectLibrary", _descriptor12, _this);
    _initializerDefineProperty(_this, "showAll", _descriptor13, _this);
    _initializerDefineProperty(_this, "open", _descriptor14, _this);
    _initializerDefineProperty(_this, "back", _descriptor15, _this);
    _initializerDefineProperty(_this, "onChanged", _descriptor16, _this);
    _initializerDefineProperty(_this, "onDeleted", _descriptor17, _this);
    // Opens the native file dialog from the toolbar button (a real user gesture, so allowed).
    _this.triggerFileDialog = function () {
      if (_this.fileInputRef.current) {
        _this.fileInputRef.current.click();
      }
    };
    _this.handleFileChange = function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file || !_this.activeLibraryId) {
        return;
      }
      // Reset the input so re-picking the same file fires change again after an error/retry.
      event.target.value = '';
      _this.startUpload(file);
    };
    // Presigned multipart upload: token stays server-side, parts go straight to storage, then we
    // poll until processing finishes. Mirrors the field-overlay upload flow.
    _initializerDefineProperty(_this, "startUpload", _descriptor18, _this);
    _initializerDefineProperty(_this, "handleIngestUrlChange", _descriptor19, _this);
    _initializerDefineProperty(_this, "handleIngestTitleChange", _descriptor20, _this);
    _initializerDefineProperty(_this, "startIngest", _descriptor21, _this);
    return _this;
  }
  _inherits(Videos, _React$Component);
  return _createClass(Videos, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      Promise.all([(0, _api.getLibraries)(), (0, _api.getAllVideos)()]).then((0, _mobx.action)(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          libraries = _ref2[0],
          videos = _ref2[1];
        _this2.libraries = libraries;
        _this2.videos = videos;
        _this2.loading = false;
      }))["catch"]((0, _mobx.action)(function (e) {
        _this2.loading = false;
        _this2.error = 428 === e.status ? (0, _utils.translate)('scale_videooptimizer.not_configured') : e.message || String(e);
      }));
    }
  }, {
    key: "reloadVideos",
    value: function reloadVideos() {
      var _this3 = this;
      this.loadingVideos = true;
      (0, _api.getAllVideos)().then((0, _mobx.action)(function (videos) {
        _this3.videos = videos;
        _this3.loadingVideos = false;
      }))["catch"]((0, _mobx.action)(function (e) {
        _this3.loadingVideos = false;
        _this3.error = e.message || String(e);
      }));
    }
  }, {
    key: "activeLibrary",
    value: function activeLibrary() {
      var _this4 = this;
      return this.libraries.find(function (l) {
        return l.id === _this4.activeLibraryId;
      }) || null;
    }
  }, {
    key: "visibleVideos",
    value: function visibleVideos() {
      var _this5 = this;
      if (!this.activeLibraryId) {
        return this.videos;
      }
      return this.videos.filter(function (video) {
        return video.library_id === _this5.activeLibraryId;
      });
    }
  }, {
    key: "renderFolders",
    value: function renderFolders() {
      if (this.libraries.length === 0) {
        return null;
      }
      return /*#__PURE__*/_react["default"].createElement(_FolderList["default"], {
        onFolderClick: this.selectLibrary
      }, this.libraries.map(function (library) {
        return /*#__PURE__*/_react["default"].createElement(_FolderList["default"].Folder, {
          key: library.id,
          id: library.id,
          title: library.name,
          info: (0, _utils.translate)('scale_videooptimizer.library_videos_count', {
            count: library.video_count || 0
          })
        });
      }));
    }
  }, {
    key: "renderVideoGrid",
    value: function renderVideoGrid() {
      var _this6 = this;
      var videos = this.visibleVideos();
      if (videos.length === 0) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-empty"
        }, (0, _utils.translate)('scale_videooptimizer.no_videos_anywhere'));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-video-grid"
      }, videos.map(function (video) {
        return /*#__PURE__*/_react["default"].createElement("button", {
          key: video.uuid,
          type: "button",
          className: "vo-video",
          onClick: function onClick() {
            return _this6.open(video);
          }
        }, (0, _api.posterFor)(video) ? /*#__PURE__*/_react["default"].createElement("img", {
          src: (0, _api.bustCache)((0, _api.posterFor)(video)),
          alt: ""
        }) : /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-video-ph"
        }, "\u25B6"), /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-video-title"
        }, video.title || video.uuid));
      }));
    }
  }, {
    key: "renderIngestForm",
    value: function renderIngestForm() {
      return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.ingest_from_url')), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions",
        style: {
          marginTop: 0,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "url",
        className: "vo-input",
        placeholder: (0, _utils.translate)('scale_videooptimizer.source_url'),
        value: this.ingestSourceUrl,
        disabled: this.ingesting,
        onChange: this.handleIngestUrlChange
      }), /*#__PURE__*/_react["default"].createElement("input", {
        type: "text",
        className: "vo-input",
        placeholder: (0, _utils.translate)('sulu_admin.title'),
        value: this.ingestTitle,
        disabled: this.ingesting,
        onChange: this.handleIngestTitleChange
      }), /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.startIngest,
        loading: this.ingesting,
        disabled: !this.ingestSourceUrl.trim()
      }, (0, _utils.translate)('scale_videooptimizer.ingest'))), this.ingestStatus && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-upload-status"
      }, this.ingestStatus));
    }
  }, {
    key: "render",
    value: function render() {
      if (this.loading) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-page vo-page--wide"
        }, /*#__PURE__*/_react["default"].createElement(_components.Loader, null));
      }
      var activeLibrary = this.activeLibrary();
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-page vo-page--wide"
      }, /*#__PURE__*/_react["default"].createElement("input", {
        ref: this.fileInputRef,
        type: "file",
        accept: "video/*",
        style: {
          display: 'none'
        },
        onChange: this.handleFileChange
      }), this.selected ? /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: "vo-back",
        onClick: this.back
      }, "\u2190 ", (0, _utils.translate)('scale_videooptimizer.back')), /*#__PURE__*/_react["default"].createElement(_VideoDetail["default"], {
        video: this.selected,
        onChanged: this.onChanged,
        onDeleted: this.onDeleted
      })) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, this.renderFolders(), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-list-header"
      }, /*#__PURE__*/_react["default"].createElement("h1", null, activeLibrary ? activeLibrary.name : (0, _utils.translate)('scale_videooptimizer.videos_nav')), activeLibrary && /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: "vo-back",
        onClick: this.showAll
      }, "\u2190 ", (0, _utils.translate)('scale_videooptimizer.show_all'))), this.uploadStatus && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-upload-status"
      }, this.uploadStatus), activeLibrary && this.renderIngestForm(), this.loadingVideos ? /*#__PURE__*/_react["default"].createElement(_components.Loader, null) : this.renderVideoGrid()), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "loadingVideos", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "libraries", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "activeLibraryId", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "videos", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "selected", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "uploading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "uploadStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "ingestSourceUrl", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "ingestTitle", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "ingesting", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "ingestStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "selectLibrary", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function (id) {
      _this7.activeLibraryId = id;
      _this7.selected = null;
    };
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "showAll", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function () {
      _this8.activeLibraryId = null;
      _this8.selected = null;
    };
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "open", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function (video) {
      _this9.selected = video;
    };
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "back", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function () {
      _this0.selected = null;
    };
  }
}), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "onChanged", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this1 = this;
    return function (video) {
      _this1.selected = video;
      _this1.videos = _this1.videos.map(function (v) {
        return v.uuid === video.uuid ? video : v;
      });
    };
  }
}), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "onDeleted", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this10 = this;
    return function () {
      var id = _this10.selected.uuid;
      _this10.selected = null;
      _this10.videos = _this10.videos.filter(function (v) {
        return v.uuid !== id;
      });
    };
  }
}), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "startUpload", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this11 = this;
    return function (file) {
      var libraryId = _this11.activeLibraryId;
      _this11.uploading = true;
      _this11.error = null;
      _this11.uploadStatus = (0, _utils.translate)('scale_videooptimizer.uploading');
      (0, _api.initiateUpload)({
        libraryId: libraryId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size
      }).then(function (upload) {
        return (0, _api.uploadParts)(file, upload.parts || [], upload.partSize).then(function (parts) {
          return (0, _api.completeUpload)({
            libraryId: libraryId,
            uuid: upload.uuid,
            key: upload.key,
            uploadId: upload.uploadId,
            title: file.name,
            parts: parts
          });
        }).then((0, _mobx.action)(function () {
          _this11.uploadStatus = (0, _utils.translate)('scale_videooptimizer.processing');
        })).then(function () {
          return (0, _api.pollVideo)(upload.uuid, function (v) {
            return v.status === 'ready' || v.status === 'failed';
          });
        }).then((0, _mobx.action)(function (video) {
          _this11.uploading = false;
          _this11.uploadStatus = null;
          if (video.status === 'failed') {
            _this11.error = (0, _utils.translate)('scale_videooptimizer.test_failed', {
              message: 'processing failed'
            });
            return;
          }
          _this11.reloadVideos();
          _this11.open(video);
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        _this11.uploading = false;
        _this11.uploadStatus = null;
        _this11.error = e.message || String(e);
      }));
    };
  }
}), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestUrlChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this12 = this;
    return function (event) {
      _this12.ingestSourceUrl = event.target.value;
    };
  }
}), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestTitleChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this13 = this;
    return function (event) {
      _this13.ingestTitle = event.target.value;
    };
  }
}), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "startIngest", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this14 = this;
    return function () {
      if (!_this14.ingestSourceUrl.trim() || !_this14.activeLibraryId) {
        return;
      }
      _this14.ingesting = true;
      _this14.error = null;
      _this14.ingestStatus = (0, _utils.translate)('scale_videooptimizer.processing');
      (0, _api.ingestVideoUrl)({
        library_id: _this14.activeLibraryId,
        source_url: _this14.ingestSourceUrl.trim(),
        title: _this14.ingestTitle.trim() || undefined
      }).then(function (result) {
        return (0, _api.pollVideo)(result.uuid, function (v) {
          return v.status === 'ready' || v.status === 'failed';
        }).then((0, _mobx.action)(function (video) {
          _this14.ingesting = false;
          _this14.ingestStatus = null;
          if (video.status === 'failed') {
            _this14.error = (0, _utils.translate)('scale_videooptimizer.test_failed', {
              message: 'processing failed'
            });
            return;
          }
          _this14.ingestSourceUrl = '';
          _this14.ingestTitle = '';
          _this14.reloadVideos();
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        _this14.ingesting = false;
        _this14.ingestStatus = null;
        _this14.error = e.message || String(e);
      }));
    };
  }
}), _class2)) || _class; // Adds the Sulu-style "upload file" button to the top view toolbar. It's enabled only inside a
// library (an upload needs a target) and not while viewing a single video's detail.
var _default = exports["default"] = (0, _containers.withToolbar)(Videos, function () {
  return {
    items: [{
      type: 'button',
      label: (0, _utils.translate)('scale_videooptimizer.upload_file'),
      icon: 'su-upload',
      loading: this.uploading,
      disabled: !this.activeLibraryId || !!this.selected,
      onClick: this.triggerFileDialog
    }]
  };
});