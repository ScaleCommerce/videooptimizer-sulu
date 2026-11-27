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
require("core-js/modules/es.array.find.js");
require("core-js/modules/es.array.index-of.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.array.sort.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.replace.js");
require("core-js/modules/es.string.search.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.find.js");
require("core-js/modules/esnext.iterator.map.js");
var _react = _interopRequireDefault(require("react"));
var _mobxReact = require("mobx-react");
var _mobx = require("mobx");
var _components = require("sulu-admin-bundle/components");
var _FolderList = _interopRequireDefault(require("sulu-admin-bundle/components/FolderList"));
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _VideoDetail = _interopRequireDefault(require("../components/VideoDetail"));
var _VideoPager = _interopRequireDefault(require("../services/VideoPager"));
var _UploadProgress = _interopRequireDefault(require("../components/UploadProgress"));
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34;
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
var VideoSelectionOverlay = (0, _mobxReact.observer)(_class = (_class2 = /*#__PURE__*/function (_React$Component) {
  function VideoSelectionOverlay() {
    var _this;
    _classCallCheck(this, VideoSelectionOverlay);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, VideoSelectionOverlay, [].concat(args));
    _initializerDefineProperty(_this, "tab", _descriptor, _this);
    _initializerDefineProperty(_this, "loading", _descriptor2, _this);
    _initializerDefineProperty(_this, "libraries", _descriptor3, _this);
    // null = show videos from every library; a library id = filter to that library.
    _initializerDefineProperty(_this, "activeLibraryId", _descriptor4, _this);
    _initializerDefineProperty(_this, "videos", _descriptor5, _this);
    _initializerDefineProperty(_this, "hasMore", _descriptor6, _this);
    _initializerDefineProperty(_this, "loadingMore", _descriptor7, _this);
    _initializerDefineProperty(_this, "loadingVideos", _descriptor8, _this);
    _initializerDefineProperty(_this, "uploading", _descriptor9, _this);
    _initializerDefineProperty(_this, "uploadStatus", _descriptor0, _this);
    _initializerDefineProperty(_this, "uploadPercent", _descriptor1, _this);
    _initializerDefineProperty(_this, "uploadCancellable", _descriptor10, _this);
    _initializerDefineProperty(_this, "ingestSourceUrl", _descriptor11, _this);
    _initializerDefineProperty(_this, "ingestTitle", _descriptor12, _this);
    _initializerDefineProperty(_this, "ingesting", _descriptor13, _this);
    _initializerDefineProperty(_this, "ingestStatus", _descriptor14, _this);
    _initializerDefineProperty(_this, "error", _descriptor15, _this);
    _initializerDefineProperty(_this, "search", _descriptor16, _this);
    _initializerDefineProperty(_this, "readyOnly", _descriptor17, _this);
    _initializerDefineProperty(_this, "managing", _descriptor18, _this);
    // Pages the video list with the API cursor; loaded pages survive edits, deletions and uploads.
    _this.pager = new _VideoPager["default"](_api.getVideoPage, (0, _mobx.action)(function (state) {
      _this.videos = state.items;
      _this.hasMore = state.hasMore;
      _this.loadingMore = state.loadingMore;
      _this.loadingVideos = state.loading;
      if (state.error) {
        _this.error = state.error.message || String(state.error);
      }
    }));
    // Aborts a running browser upload (closing the overlay or unmounting must not create a video).
    _this.uploadController = null;
    // Cancel button of the upload tab (same effect as closing the overlay).
    _initializerDefineProperty(_this, "cancelUpload", _descriptor19, _this);
    _initializerDefineProperty(_this, "setLoading", _descriptor20, _this);
    _initializerDefineProperty(_this, "selectLibrary", _descriptor21, _this);
    _initializerDefineProperty(_this, "showAll", _descriptor22, _this);
    _initializerDefineProperty(_this, "loadMore", _descriptor23, _this);
    _initializerDefineProperty(_this, "setTab", _descriptor24, _this);
    _initializerDefineProperty(_this, "handleSearch", _descriptor25, _this);
    _initializerDefineProperty(_this, "toggleReadyOnly", _descriptor26, _this);
    _this.chooseVideo = function (video) {
      _this.props.onSelect({
        uuid: video.uuid,
        libraryId: video.library_id || _this.activeLibraryId,
        title: video.title || '',
        posterUrl: (0, _api.posterFor)(video) || null
      });
      _this.props.onClose();
    };
    _initializerDefineProperty(_this, "manage", _descriptor27, _this);
    _initializerDefineProperty(_this, "closeManage", _descriptor28, _this);
    _initializerDefineProperty(_this, "updateManaged", _descriptor29, _this);
    _initializerDefineProperty(_this, "afterDelete", _descriptor30, _this);
    _this.handleFileChange = function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file || !_this.activeLibraryId) {
        return;
      }
      _this.startUpload(file);
    };
    _initializerDefineProperty(_this, "startUpload", _descriptor31, _this);
    _initializerDefineProperty(_this, "handleIngestUrlChange", _descriptor32, _this);
    _initializerDefineProperty(_this, "handleIngestTitleChange", _descriptor33, _this);
    _initializerDefineProperty(_this, "startIngest", _descriptor34, _this);
    return _this;
  }
  _inherits(VideoSelectionOverlay, _React$Component);
  return _createClass(VideoSelectionOverlay, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.load();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.abortUpload();
    }
  }, {
    key: "abortUpload",
    value: function abortUpload() {
      if (this.uploadController) {
        this.uploadController.abort();
        this.uploadController = null;
        this.uploading = false;
        this.uploadStatus = null;
        this.uploadPercent = null;
        this.uploadCancellable = false;
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!this.props.open && prevProps.open) {
        this.abortUpload();
      }
      if (this.props.open && !prevProps.open) {
        this.closeManage();
        this.load();
      }
    }
  }, {
    key: "load",
    value: function load() {
      var _this2 = this;
      this.setLoading(true);
      (0, _api.getLibraries)().then((0, _mobx.action)(function (libraries) {
        _this2.libraries = libraries;
        _this2.loading = false;
        var preferred = _this2.props.defaultLibraryId;
        // Preselect the preferred library folder when it exists; otherwise start on "all".
        _this2.activeLibraryId = preferred && libraries.find(function (l) {
          return l.id === preferred;
        }) ? preferred : null;
        _this2.pager.load({
          libraryId: _this2.activeLibraryId
        });
      }))["catch"]((0, _mobx.action)(function (e) {
        _this2.loading = false;
        _this2.error = e.message || String(e);
      }));
    }
  }, {
    key: "activeLibrary",
    value: function activeLibrary() {
      var _this3 = this;
      return this.libraries.find(function (l) {
        return l.id === _this3.activeLibraryId;
      }) || null;
    }
  }, {
    key: "filteredVideos",
    value: function filteredVideos() {
      var _this4 = this;
      var term = this.search.trim().toLowerCase();

      // The library is filtered by the API; "ready only" and the title search only see the loaded pages.
      return this.videos.filter(function (video) {
        return !_this4.readyOnly || video.status === 'ready';
      }).filter(function (video) {
        return term === '' || (video.title || '').toLowerCase().indexOf(term) !== -1;
      })
      // Show pickable (ready) videos first; the preceding filters already return a fresh array
      // and Array.sort is stable, so API order is preserved within each group.
      .sort(function (a, b) {
        return (a.status === 'ready' ? 0 : 1) - (b.status === 'ready' ? 0 : 1);
      });
    }
  }, {
    key: "renderFolders",
    value: function renderFolders() {
      var activeLibrary = this.activeLibrary();
      return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement(_FolderList["default"], {
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
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-list-header"
      }, /*#__PURE__*/_react["default"].createElement("h5", null, activeLibrary ? activeLibrary.name : (0, _utils.translate)('scale_videooptimizer.all_videos')), activeLibrary && /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: "vo-back",
        onClick: this.showAll
      }, "\u2190 ", (0, _utils.translate)('scale_videooptimizer.show_all'))));
    }
  }, {
    key: "renderSelectTab",
    value: function renderSelectTab() {
      var _this5 = this;
      if (this.managing) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-manage"
        }, /*#__PURE__*/_react["default"].createElement("button", {
          type: "button",
          className: "vo-back",
          onClick: this.closeManage
        }, (0, _utils.translate)('scale_videooptimizer.back')), /*#__PURE__*/_react["default"].createElement(_VideoDetail["default"], {
          video: this.managing,
          onChanged: this.updateManaged,
          onDeleted: this.afterDelete,
          onUse: this.chooseVideo,
          locale: this.props.locale
        }));
      }
      var videos = this.filteredVideos();
      return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-video-filter"
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "search",
        className: "vo-search",
        placeholder: (0, _utils.translate)('scale_videooptimizer.search_videos'),
        value: this.search,
        onChange: this.handleSearch
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-check"
      }, /*#__PURE__*/_react["default"].createElement("input", {
        type: "checkbox",
        checked: this.readyOnly,
        onChange: this.toggleReadyOnly
      }), (0, _utils.translate)('scale_videooptimizer.ready_only'))), this.loadingVideos ? /*#__PURE__*/_react["default"].createElement(_components.Loader, null) : videos.length === 0 ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-empty"
      }, (0, _utils.translate)('scale_videooptimizer.no_matches')) : /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-video-grid"
      }, videos.map(function (video) {
        var poster = (0, _api.posterFor)(video);
        var ready = video.status === 'ready';
        var failed = video.status === 'failed';
        return /*#__PURE__*/_react["default"].createElement("div", {
          key: video.uuid,
          className: "vo-video-item"
        }, /*#__PURE__*/_react["default"].createElement("button", {
          type: "button",
          className: "vo-video",
          disabled: !ready,
          onClick: ready ? function () {
            return _this5.chooseVideo(video);
          } : undefined
        }, poster ? /*#__PURE__*/_react["default"].createElement("img", {
          src: (0, _api.bustCache)(poster),
          alt: video.title || ''
        }) : /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-video-ph"
        }, "\u25B6"), /*#__PURE__*/_react["default"].createElement("span", {
          className: "vo-video-title"
        }, video.title || video.uuid), /*#__PURE__*/_react["default"].createElement("span", {
          className: 'vo-video-status vo-video-status--' + (ready ? 'ready' : failed ? 'failed' : 'processing'),
          title: failed && video.error ? String(video.error) : undefined
        }, ready ? '' : (0, _utils.translate)(failed ? 'scale_videooptimizer.status_failed' : 'scale_videooptimizer.processing'))), /*#__PURE__*/_react["default"].createElement("button", {
          type: "button",
          className: "vo-video-manage",
          title: (0, _utils.translate)('scale_videooptimizer.manage'),
          onClick: function onClick(event) {
            event.stopPropagation();
            _this5.manage(video);
          }
        }, "\u2699"));
      })), this.hasMore && !this.loadingVideos && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-load-more"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.loadMore,
        loading: this.loadingMore
      }, (0, _utils.translate)('scale_videooptimizer.load_more'))));
    }
  }, {
    key: "renderUploadTab",
    value: function renderUploadTab() {
      // Upload and URL ingest need a target library — only available once a folder is selected.
      if (!this.activeLibraryId) {
        return /*#__PURE__*/_react["default"].createElement("div", {
          className: "vo-hint"
        }, (0, _utils.translate)('scale_videooptimizer.select_library_hint'));
      }
      return /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-uploader"
      }, /*#__PURE__*/_react["default"].createElement("p", {
        className: "vo-hint"
      }, (0, _utils.translate)('scale_videooptimizer.upload_hint')), /*#__PURE__*/_react["default"].createElement("input", {
        type: "file",
        accept: "video/*",
        disabled: this.uploading,
        onChange: this.handleFileChange
      }), /*#__PURE__*/_react["default"].createElement(_UploadProgress["default"], {
        status: this.uploadStatus,
        percent: this.uploadPercent,
        onCancel: this.uploadCancellable ? this.cancelUpload : null
      }), /*#__PURE__*/_react["default"].createElement("label", {
        className: "vo-label"
      }, (0, _utils.translate)('scale_videooptimizer.ingest_from_url')), /*#__PURE__*/_react["default"].createElement("input", {
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
      }), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-actions"
      }, /*#__PURE__*/_react["default"].createElement(_components.Button, {
        skin: "secondary",
        onClick: this.startIngest,
        loading: this.ingesting,
        disabled: !this.ingestSourceUrl.trim()
      }, (0, _utils.translate)('scale_videooptimizer.ingest'))), /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-hint",
        style: {
          padding: '4px 0 0'
        }
      }, (0, _utils.translate)('scale_videooptimizer.ingest_url_help')), this.ingestStatus && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-upload-status"
      }, this.ingestStatus));
    }
  }, {
    key: "render",
    value: function render() {
      var _this6 = this;
      var _this$props = this.props,
        open = _this$props.open,
        onClose = _this$props.onClose;
      return /*#__PURE__*/_react["default"].createElement(_components.Overlay, {
        open: open,
        onClose: onClose,
        title: (0, _utils.translate)('scale_videooptimizer.select_video'),
        actions: [{
          title: (0, _utils.translate)('sulu_admin.cancel'),
          onClick: onClose
        }],
        size: "large"
      }, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-overlay"
      }, this.loading ? /*#__PURE__*/_react["default"].createElement(_components.Loader, null) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-tabs"
      }, /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: 'vo-tab ' + (this.tab === 'select' ? 'vo-tab--active' : ''),
        onClick: function onClick() {
          return _this6.setTab('select');
        }
      }, (0, _utils.translate)('scale_videooptimizer.tab_select')), /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        className: 'vo-tab ' + (this.tab === 'upload' ? 'vo-tab--active' : ''),
        onClick: function onClick() {
          return _this6.setTab('upload');
        }
      }, (0, _utils.translate)('scale_videooptimizer.tab_upload'))), this.libraries.length === 0 ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-empty"
      }, (0, _utils.translate)('scale_videooptimizer.not_configured')) : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, this.renderFolders(), this.tab === 'select' ? this.renderSelectTab() : this.renderUploadTab()), this.error && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-message vo-message--error"
      }, this.error))));
    }
  }]);
}(_react["default"].Component), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "tab", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return 'select';
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "loading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return true;
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
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "hasMore", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "loadingMore", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "loadingVideos", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "uploading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "uploadStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "uploadPercent", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "uploadCancellable", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "ingestSourceUrl", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "ingestTitle", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "ingesting", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "ingestStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "search", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "readyOnly", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "managing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _applyDecoratedDescriptor(_class2.prototype, "abortUpload", [_mobx.action], Object.getOwnPropertyDescriptor(_class2.prototype, "abortUpload"), _class2.prototype), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "cancelUpload", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function () {
      _this7.abortUpload();
    };
  }
}), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "setLoading", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function (value) {
      _this8.loading = value;
      _this8.error = null;
    };
  }
}), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "selectLibrary", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function (id) {
      _this9.activeLibraryId = id;
      _this9.search = '';
      _this9.readyOnly = false;
      _this9.managing = null;
      _this9.error = null;
      _this9.pager.load({
        libraryId: id
      });
    };
  }
}), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "showAll", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function () {
      _this0.activeLibraryId = null;
      _this0.managing = null;
      _this0.error = null;
      _this0.pager.load({
        libraryId: null
      });
    };
  }
}), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "loadMore", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this1 = this;
    return function () {
      _this1.pager.loadMore();
    };
  }
}), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "setTab", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this10 = this;
    return function (tab) {
      _this10.tab = tab;
    };
  }
}), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "handleSearch", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this11 = this;
    return function (event) {
      _this11.search = event.target.value;
    };
  }
}), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "toggleReadyOnly", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this12 = this;
    return function () {
      _this12.readyOnly = !_this12.readyOnly;
    };
  }
}), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "manage", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this13 = this;
    return function (video) {
      _this13.managing = video;
    };
  }
}), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "closeManage", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this14 = this;
    return function () {
      _this14.managing = null;
    };
  }
}), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "updateManaged", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this15 = this;
    return function (video) {
      _this15.managing = video;
      _this15.pager.replace(video);
    };
  }
}), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "afterDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this16 = this;
    return function () {
      var id = _this16.managing.uuid;
      _this16.managing = null;
      _this16.pager.remove(id);
    };
  }
}), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "startUpload", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this17 = this;
    return function (file) {
      _this17.abortUpload();
      var controller = new AbortController();
      _this17.uploadController = controller;
      _this17.uploading = true;
      _this17.error = null;
      _this17.uploadStatus = (0, _utils.translate)('scale_videooptimizer.uploading');
      _this17.uploadPercent = 0;
      _this17.uploadCancellable = true;
      (0, _api.initiateUpload)({
        libraryId: _this17.activeLibraryId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size
      }).then(function (upload) {
        return (0, _api.uploadParts)(file, upload.parts || [], upload.partSize, controller.signal, (0, _mobx.action)(function (done, total) {
          if (_this17.uploadController === controller) {
            _this17.uploadPercent = Math.round(done / total * 100);
          }
        })).then(function (parts) {
          if (controller.signal.aborted) {
            throw (0, _api.abortError)();
          }
          return (0, _api.completeUpload)({
            libraryId: _this17.activeLibraryId,
            uuid: upload.uuid,
            key: upload.key,
            uploadId: upload.uploadId,
            title: file.name,
            parts: parts
          });
        }).then((0, _mobx.action)(function () {
          if (_this17.uploadController !== controller) {
            throw (0, _api.abortError)();
          }
          _this17.uploadStatus = (0, _utils.translate)('scale_videooptimizer.processing');
          _this17.uploadPercent = null;
          _this17.uploadCancellable = false;
        })).then(function () {
          return (0, _api.pollVideo)(upload.uuid, function (v) {
            return v.status === 'ready' || v.status === 'failed';
          }, {
            signal: controller.signal
          });
        }).then((0, _mobx.action)(function (video) {
          if (_this17.uploadController !== controller) {
            return;
          }
          _this17.uploadController = null;
          _this17.uploading = false;
          _this17.uploadStatus = null;
          _this17.uploadPercent = null;
          _this17.uploadCancellable = false;
          if (video.status === 'failed') {
            _this17.error = (0, _api.failureMessage)(video);
            return;
          }
          _this17.chooseVideo(video);
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        // Superseded, aborted or unmounted: a newer upload or the closed view owns the state.
        if (_this17.uploadController !== controller || (0, _api.isAbortError)(e)) {
          return;
        }
        _this17.uploadController = null;
        _this17.uploading = false;
        _this17.uploadStatus = null;
        _this17.uploadPercent = null;
        _this17.uploadCancellable = false;
        _this17.error = (0, _api.errorText)(e);
      }));
    };
  }
}), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestUrlChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this18 = this;
    return function (event) {
      _this18.ingestSourceUrl = event.target.value;
    };
  }
}), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestTitleChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this19 = this;
    return function (event) {
      _this19.ingestTitle = event.target.value;
    };
  }
}), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "startIngest", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this20 = this;
    return function () {
      if (!_this20.ingestSourceUrl.trim() || !_this20.activeLibraryId) {
        return;
      }
      _this20.ingesting = true;
      _this20.error = null;
      _this20.ingestStatus = (0, _utils.translate)('scale_videooptimizer.processing');
      (0, _api.ingestVideoUrl)({
        library_id: _this20.activeLibraryId,
        source_url: _this20.ingestSourceUrl.trim(),
        title: _this20.ingestTitle.trim() || undefined
      }).then(function (result) {
        return (0, _api.pollVideo)(result.uuid, function (v) {
          return v.status === 'ready' || v.status === 'failed';
        }).then((0, _mobx.action)(function (video) {
          _this20.ingesting = false;
          _this20.ingestStatus = null;
          if (video.status === 'failed') {
            _this20.error = (0, _api.failureMessage)(video);
            return;
          }
          _this20.ingestSourceUrl = '';
          _this20.ingestTitle = '';
          _this20.chooseVideo(video);
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        _this20.ingesting = false;
        _this20.ingestStatus = null;
        _this20.error = (0, _api.errorText)(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = VideoSelectionOverlay;