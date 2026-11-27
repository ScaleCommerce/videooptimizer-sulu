"use strict";

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.object.define-properties.js");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.object.get-own-property-descriptors.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/esnext.iterator.for-each.js");
require("core-js/modules/web.dom-collections.for-each.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.PAGE_SIZE = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.filter.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.array.some.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.set.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.filter.js");
require("core-js/modules/esnext.iterator.map.js");
require("core-js/modules/esnext.iterator.some.js");
require("core-js/modules/web.dom-collections.iterator.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Cursor paging of the video lists ("Load more"). Framework-free so it can be unit tested: the views
// hand in a fetchPage({libraryId, tags, cursor, limit}) function and an onChange(state) callback.
//
// - Pages are appended, never reloaded: edits, deletions and uploads patch the loaded list in place,
//   so the editor does not lose the pages they already scrolled through.
// - Every load() starts a new generation: a slow response of a superseded filter or library is dropped.
var PAGE_SIZE = exports.PAGE_SIZE = 60;
var VideoPager = exports["default"] = /*#__PURE__*/function () {
  function VideoPager(fetchPage, onChange) {
    var pageSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PAGE_SIZE;
    _classCallCheck(this, VideoPager);
    this.state = {
      items: [],
      hasMore: false,
      loading: false,
      loadingMore: false,
      error: null
    };
    this.filters = {};
    this.cursor = null;
    this.generation = 0;
    this.fetchPage = fetchPage;
    this.onChange = onChange;
    this.pageSize = pageSize;
  }
  return _createClass(VideoPager, [{
    key: "set",
    value: function set(patch) {
      this.state = _objectSpread(_objectSpread({}, this.state), patch);
      this.onChange(this.state);
    }

    // Starts over with new filters (library, tags): resets the list and loads the first page.
  }, {
    key: "load",
    value: function load() {
      var _this = this;
      var filters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var generation = ++this.generation;
      this.filters = filters;
      this.cursor = null;
      this.set({
        items: [],
        hasMore: false,
        loading: true,
        loadingMore: false,
        error: null
      });
      return this.fetchPage(_objectSpread(_objectSpread({}, filters), {}, {
        cursor: null,
        limit: this.pageSize
      })).then(function (page) {
        if (generation !== _this.generation) {
          return;
        }
        _this.cursor = page.nextCursor || null;
        _this.set({
          items: page.videos,
          hasMore: !!page.hasMore && !!_this.cursor,
          loading: false
        });
      }, function (error) {
        if (generation !== _this.generation) {
          return;
        }
        _this.set({
          loading: false,
          error: error
        });
      });
    }

    // Appends the next page. A failed page keeps everything loaded so far and can simply be retried.
  }, {
    key: "loadMore",
    value: function loadMore() {
      var _this2 = this;
      var _this$state = this.state,
        hasMore = _this$state.hasMore,
        loading = _this$state.loading,
        loadingMore = _this$state.loadingMore;
      if (!hasMore || loading || loadingMore || !this.cursor) {
        return Promise.resolve();
      }
      var generation = this.generation;
      this.set({
        loadingMore: true,
        error: null
      });
      return this.fetchPage(_objectSpread(_objectSpread({}, this.filters), {}, {
        cursor: this.cursor,
        limit: this.pageSize
      })).then(function (page) {
        if (generation !== _this2.generation) {
          return;
        }
        var known = new Set(_this2.state.items.map(function (video) {
          return video.uuid;
        }));
        _this2.cursor = page.nextCursor || null;
        _this2.set({
          items: _this2.state.items.concat(page.videos.filter(function (video) {
            return !known.has(video.uuid);
          })),
          hasMore: !!page.hasMore && !!_this2.cursor,
          loadingMore: false
        });
      }, function (error) {
        if (generation !== _this2.generation) {
          return;
        }
        _this2.set({
          loadingMore: false,
          error: error
        });
      });
    }
  }, {
    key: "replace",
    value: function replace(video) {
      this.set({
        items: this.state.items.map(function (item) {
          return item.uuid === video.uuid ? video : item;
        })
      });
    }
  }, {
    key: "remove",
    value: function remove(uuid) {
      this.set({
        items: this.state.items.filter(function (item) {
          return item.uuid !== uuid;
        })
      });
    }

    // Puts a just-created video on top without reloading (it is the newest one).
  }, {
    key: "prepend",
    value: function prepend(video) {
      if (this.state.items.some(function (item) {
        return item.uuid === video.uuid;
      })) {
        return;
      }
      this.set({
        items: [video].concat(this.state.items)
      });
    }
  }]);
}();