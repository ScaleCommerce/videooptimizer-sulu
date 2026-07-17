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
require("core-js/modules/es.array.index-of.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.array.sort.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.search.js");
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
var _utils = require("sulu-admin-bundle/utils");
var _api = require("../services/api");
var _VideoDetail = _interopRequireDefault(require("../components/VideoDetail"));
var _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27;
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
    _initializerDefineProperty(_this, "uploading", _descriptor6, _this);
    _initializerDefineProperty(_this, "uploadStatus", _descriptor7, _this);
    _initializerDefineProperty(_this, "ingestSourceUrl", _descriptor8, _this);
    _initializerDefineProperty(_this, "ingestTitle", _descriptor9, _this);
    _initializerDefineProperty(_this, "ingesting", _descriptor0, _this);
    _initializerDefineProperty(_this, "ingestStatus", _descriptor1, _this);
    _initializerDefineProperty(_this, "error", _descriptor10, _this);
    _initializerDefineProperty(_this, "search", _descriptor11, _this);
    _initializerDefineProperty(_this, "readyOnly", _descriptor12, _this);
    _initializerDefineProperty(_this, "managing", _descriptor13, _this);
    _initializerDefineProperty(_this, "setLoading", _descriptor14, _this);
    _initializerDefineProperty(_this, "selectLibrary", _descriptor15, _this);
    _initializerDefineProperty(_this, "showAll", _descriptor16, _this);
    _initializerDefineProperty(_this, "setTab", _descriptor17, _this);
    _initializerDefineProperty(_this, "handleSearch", _descriptor18, _this);
    _initializerDefineProperty(_this, "toggleReadyOnly", _descriptor19, _this);
    _this.chooseVideo = function (video) {
      _this.props.onSelect({
        uuid: video.uuid,
        libraryId: video.library_id || _this.activeLibraryId,
        title: video.title || '',
        posterUrl: (0, _api.posterFor)(video) || null
      });
      _this.props.onClose();
    };
    _initializerDefineProperty(_this, "manage", _descriptor20, _this);
    _initializerDefineProperty(_this, "closeManage", _descriptor21, _this);
    _initializerDefineProperty(_this, "updateManaged", _descriptor22, _this);
    _initializerDefineProperty(_this, "afterDelete", _descriptor23, _this);
    _this.handleFileChange = function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file || !_this.activeLibraryId) {
        return;
      }
      _this.startUpload(file);
    };
    _initializerDefineProperty(_this, "startUpload", _descriptor24, _this);
    _initializerDefineProperty(_this, "handleIngestUrlChange", _descriptor25, _this);
    _initializerDefineProperty(_this, "handleIngestTitleChange", _descriptor26, _this);
    _initializerDefineProperty(_this, "startIngest", _descriptor27, _this);
    return _this;
  }
  _inherits(VideoSelectionOverlay, _React$Component);
  return _createClass(VideoSelectionOverlay, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.load();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
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
      Promise.all([(0, _api.getLibraries)(), (0, _api.getAllVideos)()]).then((0, _mobx.action)(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          libraries = _ref2[0],
          videos = _ref2[1];
        _this2.libraries = libraries;
        _this2.videos = videos;
        _this2.loading = false;
        var preferred = _this2.props.defaultLibraryId;
        // Preselect the preferred library folder when it exists; otherwise start on "all".
        _this2.activeLibraryId = preferred && libraries.find(function (l) {
          return l.id === preferred;
        }) ? preferred : null;
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
      return this.videos.filter(function (video) {
        return !_this4.activeLibraryId || video.library_id === _this4.activeLibraryId;
      }).filter(function (video) {
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
      }), (0, _utils.translate)('scale_videooptimizer.ready_only'))), videos.length === 0 ? /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-empty"
      }, (0, _utils.translate)('scale_videooptimizer.no_matches')) : /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-video-grid"
      }, videos.map(function (video) {
        var poster = (0, _api.posterFor)(video);
        var ready = video.status === 'ready';
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
          className: 'vo-video-status vo-video-status--' + (ready ? 'ready' : 'processing')
        }, ready ? '' : (0, _utils.translate)('scale_videooptimizer.processing'))), /*#__PURE__*/_react["default"].createElement("button", {
          type: "button",
          className: "vo-video-manage",
          title: (0, _utils.translate)('scale_videooptimizer.manage'),
          onClick: function onClick(event) {
            event.stopPropagation();
            _this5.manage(video);
          }
        }, "\u2699"));
      })));
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
      }), this.uploadStatus && /*#__PURE__*/_react["default"].createElement("div", {
        className: "vo-upload-status"
      }, this.uploadStatus), /*#__PURE__*/_react["default"].createElement("label", {
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
      }, (0, _utils.translate)('scale_videooptimizer.ingest'))), this.ingestStatus && /*#__PURE__*/_react["default"].createElement("div", {
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
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "uploading", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "uploadStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "ingestSourceUrl", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "ingestTitle", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "ingesting", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "ingestStatus", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "error", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "search", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return '';
  }
}), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "readyOnly", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "managing", [_mobx.observable], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "setLoading", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;
    return function (value) {
      _this7.loading = value;
      _this7.error = null;
    };
  }
}), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "selectLibrary", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;
    return function (id) {
      _this8.activeLibraryId = id;
      _this8.search = '';
      _this8.readyOnly = false;
      _this8.managing = null;
    };
  }
}), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "showAll", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this9 = this;
    return function () {
      _this9.activeLibraryId = null;
      _this9.managing = null;
    };
  }
}), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "setTab", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this0 = this;
    return function (tab) {
      _this0.tab = tab;
    };
  }
}), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "handleSearch", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this1 = this;
    return function (event) {
      _this1.search = event.target.value;
    };
  }
}), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "toggleReadyOnly", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this10 = this;
    return function () {
      _this10.readyOnly = !_this10.readyOnly;
    };
  }
}), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "manage", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this11 = this;
    return function (video) {
      _this11.managing = video;
    };
  }
}), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "closeManage", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this12 = this;
    return function () {
      _this12.managing = null;
    };
  }
}), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "updateManaged", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this13 = this;
    return function (video) {
      _this13.managing = video;
      _this13.videos = _this13.videos.map(function (v) {
        return v.uuid === video.uuid ? video : v;
      });
    };
  }
}), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "afterDelete", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this14 = this;
    return function () {
      var id = _this14.managing.uuid;
      _this14.managing = null;
      _this14.videos = _this14.videos.filter(function (v) {
        return v.uuid !== id;
      });
    };
  }
}), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "startUpload", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this15 = this;
    return function (file) {
      _this15.uploading = true;
      _this15.error = null;
      _this15.uploadStatus = (0, _utils.translate)('scale_videooptimizer.uploading');
      (0, _api.initiateUpload)({
        libraryId: _this15.activeLibraryId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size
      }).then(function (upload) {
        return (0, _api.uploadParts)(file, upload.parts || [], upload.partSize).then(function (parts) {
          return (0, _api.completeUpload)({
            libraryId: _this15.activeLibraryId,
            uuid: upload.uuid,
            key: upload.key,
            uploadId: upload.uploadId,
            title: file.name,
            parts: parts
          });
        }).then((0, _mobx.action)(function () {
          _this15.uploadStatus = (0, _utils.translate)('scale_videooptimizer.processing');
        })).then(function () {
          return (0, _api.pollVideo)(upload.uuid, function (v) {
            return v.status === 'ready' || v.status === 'failed';
          });
        }).then((0, _mobx.action)(function (video) {
          _this15.uploading = false;
          _this15.uploadStatus = null;
          if (video.status === 'failed') {
            _this15.error = (0, _utils.translate)('scale_videooptimizer.test_failed', {
              message: 'processing failed'
            });
            return;
          }
          _this15.chooseVideo(video);
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        _this15.uploading = false;
        _this15.uploadStatus = null;
        _this15.error = e.message || String(e);
      }));
    };
  }
}), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestUrlChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this16 = this;
    return function (event) {
      _this16.ingestSourceUrl = event.target.value;
    };
  }
}), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "handleIngestTitleChange", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this17 = this;
    return function (event) {
      _this17.ingestTitle = event.target.value;
    };
  }
}), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "startIngest", [_mobx.action], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this18 = this;
    return function () {
      if (!_this18.ingestSourceUrl.trim() || !_this18.activeLibraryId) {
        return;
      }
      _this18.ingesting = true;
      _this18.error = null;
      _this18.ingestStatus = (0, _utils.translate)('scale_videooptimizer.processing');
      (0, _api.ingestVideoUrl)({
        library_id: _this18.activeLibraryId,
        source_url: _this18.ingestSourceUrl.trim(),
        title: _this18.ingestTitle.trim() || undefined
      }).then(function (result) {
        return (0, _api.pollVideo)(result.uuid, function (v) {
          return v.status === 'ready' || v.status === 'failed';
        }).then((0, _mobx.action)(function (video) {
          _this18.ingesting = false;
          _this18.ingestStatus = null;
          if (video.status === 'failed') {
            _this18.error = (0, _utils.translate)('scale_videooptimizer.test_failed', {
              message: 'processing failed'
            });
            return;
          }
          _this18.ingestSourceUrl = '';
          _this18.ingestTitle = '';
          _this18.chooseVideo(video);
        }));
      })["catch"]((0, _mobx.action)(function (e) {
        _this18.ingesting = false;
        _this18.ingestStatus = null;
        _this18.error = e.message || String(e);
      }));
    };
  }
}), _class2)) || _class;
var _default = exports["default"] = VideoSelectionOverlay;