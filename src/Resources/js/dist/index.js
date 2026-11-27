"use strict";

var _containers = require("sulu-admin-bundle/containers");
var _services = require("sulu-admin-bundle/services");
var _fieldRegistry = _interopRequireDefault(require("sulu-admin-bundle/containers/Form/registries/fieldRegistry"));
var _Settings = _interopRequireDefault(require("./views/Settings"));
var _Libraries = _interopRequireDefault(require("./views/Libraries"));
var _Videos = _interopRequireDefault(require("./views/Videos"));
var _VideoOptimizerField = _interopRequireDefault(require("./fields/VideoOptimizerField"));
var _permissions = require("./services/permissions");
require("./styles.css");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// Custom admin views for the VideoOptimizer settings and library management.
_containers.viewRegistry.add('scale_videooptimizer_settings', _Settings["default"]);
_containers.viewRegistry.add('scale_videooptimizer_libraries', _Libraries["default"]);
_containers.viewRegistry.add('scale_videooptimizer_videos', _Videos["default"]);

// The server tells which VideoOptimizer actions the current user may use (hides the rest).
_services.initializer.addUpdateConfigHook('scale_videooptimizer', function (config) {
  (0, _permissions.setPermissions)(config ? config.permissions : null);
});

// Content field type used by the `video_optimizer` property in page templates.
_fieldRegistry["default"].add('video_optimizer', _VideoOptimizerField["default"]);