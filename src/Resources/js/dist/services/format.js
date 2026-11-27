"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatBytes = formatBytes;
exports.formatPercent = formatPercent;
exports.lastDaysRange = lastDaysRange;
exports.utcDay = utcDay;
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-iso-string.js");
require("core-js/modules/es.date.to-string.js");
require("core-js/modules/es.number.to-fixed.js");
// Number and date formatting shared by the admin views.
// Formats a byte count as a human-readable size (e.g. 1536 -> "1.5 KB").
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) {
    return '0 B';
  }
  var units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  var value = bytes / Math.pow(1024, exponent);
  return (exponent === 0 ? value : value.toFixed(1)) + ' ' + units[exponent];
}

// 78.24 -> "78.2" (locale-aware decimal separator); non-numbers give "0".
function formatPercent(value, locale) {
  var number = typeof value === 'number' && isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale || undefined, {
    maximumFractionDigits: 1
  }).format(number);
}

// UTC day as YYYY-MM-DD (the API's date format).
function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

// The last `days` UTC days up to and including today, as the API's from/to range (max. 366 days).
function lastDaysRange(days) {
  var now = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
  var from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  return {
    from: utcDay(from),
    to: utcDay(now)
  };
}