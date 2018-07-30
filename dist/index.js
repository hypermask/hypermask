(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("hypermask", ["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.HyperMask = mod.exports;
  }
})(this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = withHyperMask;
  _exports.wrapProvider = void 0;

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

  function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

  function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

  function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

  function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

  function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

  function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  var HYPERMASK_URL = "https://app.hypermask.io/";

  var HookedProvider =
  /*#__PURE__*/
  function () {
    function HookedProvider(base) {
      var _this = this;

      var overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, HookedProvider);

      this.baseProvider = base;
      this.overrides = overrides;

      var _loop = function _loop(method) {
        if (typeof base[method] === "function" && method[0] != "_") {
          _this[method] = function () {
            if (method === "send") {
              var payload = arguments[0],
                  callback = arguments[1],
                  intercept_callback = typeof callback === "function" ? function (err, res) {
                if (!err && res.error) return callback(new Error(res.error.message), null);
                callback(err, res);
              } : callback;

              if (this.overrides[payload.method]) {
                return this.overrides[payload.method].apply(this, payload.params).then(function (result) {
                  return intercept_callback(null, {
                    jsonrpc: "2.0",
                    id: payload.id,
                    result: result
                  });
                }).catch(function (error) {
                  return intercept_callback(error, null);
                });
              } else {
                return this.baseProvider.send(payload, intercept_callback);
              }
            }

            return this.baseProvider[method].apply(this.baseProvider, arguments);
          };
        }
      };

      for (var method in base) {
        _loop(method);
      }
    }

    _createClass(HookedProvider, [{
      key: "sendAsync",
      value: function sendAsync(payload, callback) {
        return this.send(payload, callback);
      }
    }, {
      key: "_provider_rpc",
      value: function _provider_rpc(method) {
        var _this2 = this;

        for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          params[_key - 1] = arguments[_key];
        }

        return new Promise(function (resolve, reject) {
          return _this2.send({
            jsonrpc: "2.0",
            id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
            method: method,
            params: params
          }, function (err, result) {
            return err ? reject(err) : resolve(result.result);
          });
        });
      }
    }]);

    return HookedProvider;
  }();

  var HyperMaskProvider =
  /*#__PURE__*/
  function (_HookedProvider) {
    _inherits(HyperMaskProvider, _HookedProvider);

    function HyperMaskProvider(base) {
      var _this3;

      var overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var rpcMethods = arguments.length > 2 ? arguments[2] : undefined;
      var hyperMaskURL = arguments.length > 3 ? arguments[3] : undefined;

      _classCallCheck(this, HyperMaskProvider);

      _this3 = _possibleConstructorReturn(this, _getPrototypeOf(HyperMaskProvider).call(this, base, overrides));
      _this3.isHyperMask = true;
      _this3._rpcMethods = rpcMethods;
      var link = document.createElement("a");
      link.href = hyperMaskURL;
      _this3._hyperMaskURL = hyperMaskURL;
      _this3._hyperMaskOrigin = link.origin;
      _this3._rpcHandlers = {};
      _this3._channel = null;
      _this3._hyperMaskFrame = null;
      _this3._hyperMaskModal = null;
      _this3._messageListener = null;

      _this3.initializeFrame();

      return _this3;
    }

    _createClass(HyperMaskProvider, [{
      key: "initializeFrame",
      value: function initializeFrame() {
        return new Promise(function ($return, $error) {
          var _this4, stopSpinner, chain, channel;

          _this4 = this;
          stopSpinner = createHyperMaskSpinner();
          return Promise.resolve(this._provider_rpc("net_version")).then(function ($await_4) {
            try {
              chain = $await_4;
              channel = "hm" + (Date.now() * 1000 + Math.floor(Math.random() * 1000));
              this._channel = channel;
              this._hyperMaskFrame = document.createElement("iframe");
              this._hyperMaskFrame.src = this._hyperMaskURL + (this._hyperMaskURL.indexOf("?") == -1 ? "?" : "&") + "channel=" + channel + "&chain=" + chain + "&origin=" + encodeURIComponent(window.location.origin);
              this._hyperMaskModal = document.createElement("div");
              this._hyperMaskModal.className = "hypermask_modal";

              this._hyperMaskModal.appendChild(this._hyperMaskFrame);

              this._hyperMaskModal.style.display = "none";
              document.body.appendChild(this._hyperMaskModal); // attach event listeners

              this._messageListener = window.addEventListener("message", function (event) {
                var data = event.data;

                if (data.channel != _this4._channel) {
                  console.warn("Unrecognized data channel.");
                  return;
                }

                if (event.origin != _this4._hyperMaskOrigin) {
                  console.warn("Improper request origin.");
                  return;
                }

                if (data.app === "hypermask-reply") {
                  if (data.id in _this4._rpcHandlers) {
                    var _this4$_rpcHandlers$d = _slicedToArray(_this4._rpcHandlers[data.id], 2),
                        resolve = _this4$_rpcHandlers$d[0],
                        reject = _this4$_rpcHandlers$d[1];

                    data.error ? reject(data.error) : resolve(data.result);
                    delete _this4._rpcHandlers[data.id];
                  } else {
                    console.warn(data.id, "not in rpcHandlers");
                  }
                } else if (data.app === "hypermask-call") {
                  _this4._rpcMethods[data.method].apply(_this4, data.params).then(function (result) {
                    return event.source.postMessage({
                      app: "hypermask-reply",
                      id: data.id,
                      result: result
                    }, _this4._hyperMaskOrigin);
                  }).catch(function (error) {
                    event.source.postMessage({
                      app: "hypermask-reply",
                      id: data.id,
                      error: error.message
                    }, _this4._hyperMaskOrigin);
                  });
                }
              }, false);
              return Promise.resolve(new Promise(function (resolve, reject) {
                _this4._hyperMaskFrame.onload = resolve;
                _this4._hyperMaskFrame.onerror = reject;
              })).then(function ($await_5) {
                try {
                  stopSpinner();
                  return $return();
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }, $error);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }.bind(this));
      }
    }, {
      key: "reset",
      value: function reset() {
        if (this._hyperMaskModal) {
          this._hyperMaskModal.innerHTML = "";

          this._hyperMaskModal.remove();

          window.removeEventListener("message", this._messageListener);
        }

        this._hyperMaskModal = null;
        this._hyperMaskFrame = null;
        this._messageListener = null;
        this._channel = null;
        this._rpcHandlers = {};
      }
    }, {
      key: "_hyper_rpc",
      value: function _hyper_rpc(method) {
        var $args = arguments;
        return new Promise(function ($return, $error) {
          var _this5, _len2, params, _key2, msg;

          _this5 = this;

          for (_len2 = $args.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            params[_key2 - 1] = $args[_key2];
          }

          if (!this._hyperMaskFrame || !this._hyperMaskModal) {
            return Promise.resolve(this.initializeFrame()).then(function ($await_6) {
              try {
                return $If_3.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }

          function $If_3() {
            msg = {
              app: "hypermask-call",
              id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
              method: method,
              params: params
            };

            this._hyperMaskFrame.contentWindow.postMessage(msg, this._hyperMaskOrigin);

            return Promise.resolve(new Promise(function (resolve, reject) {
              _this5._rpcHandlers[msg.id] = [resolve, reject];
            })).then($return, $error);
          }

          return $If_3.call(this);
        }.bind(this));
      }
    }]);

    return HyperMaskProvider;
  }(HookedProvider);

  var rpcMethods = {
    setStyle: function setStyle(style) {
      return new Promise(function ($return, $error) {
        this._hyperMaskModal.setAttribute("style", style);

        return $return();
      }.bind(this));
    },
    insertStylesheet: function insertStylesheet(sheet) {
      return new Promise(function ($return, $error) {
        var style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = sheet;
        document.getElementsByTagName("head")[0].appendChild(style);
        return $return();
      });
    },
    closeModal: function closeModal() {
      return new Promise(function ($return, $error) {
        this._hyperMaskModal.style.animationName = "hypermask-exit-animation";
        return Promise.resolve(new Promise(function (resolve) {
          return setTimeout(resolve, 500);
        })).then(function ($await_8) {
          try {
            this._hyperMaskModal.style.display = "none";
            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      }.bind(this));
    },
    relayProvider: function relayProvider(method) {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var _len3, params, _key3;

        for (_len3 = $args.length, params = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
          params[_key3 - 1] = $args[_key3];
        }

        return Promise.resolve(this._provider_rpc.apply(this, [method].concat(params))).then($return, $error);
      }.bind(this));
    }
  };
  var providerHooks = {
    // override eth_coinbase to return the first result of eth_accounts
    eth_coinbase: function eth_coinbase() {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._provider_rpc("eth_accounts")).then(function ($await_10) {
          try {
            return $return($await_10[0]);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      }.bind(this));
    },
    eth_accounts: function eth_accounts() {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._hyper_rpc("eth_accounts")).then($return, $error);
      }.bind(this));
    },
    eth_sendTransaction: function eth_sendTransaction(txParams) {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._hyper_rpc("eth_sendTransaction", txParams)).then($return, $error);
      }.bind(this));
    },
    personal_sign: function personal_sign(message, from) {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._hyper_rpc("personal_sign", message, from)).then($return, $error);
      }.bind(this));
    },
    eth_sign: function eth_sign(from, message) {
      return new Promise(function ($return, $error) {
        return Promise.resolve(this._hyper_rpc("eth_sign", from, message)).then($return, $error);
      }.bind(this));
    },
    eth_signTypedData: function eth_signTypedData(message, from) {
      var $args = arguments;
      return new Promise(function ($return, $error) {
        var extraParams;
        extraParams = $args.length > 2 && $args[2] !== undefined ? $args[2] : {};
        return Promise.resolve(this._hyper_rpc("eth_signTypedData", message, from, extraParams)).then($return, $error);
      }.bind(this));
    }
  };

  function withHyperMask(provider) {
    var hyperMaskURL = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : HYPERMASK_URL;
    return new HyperMaskProvider(provider, providerHooks, rpcMethods, hyperMaskURL);
  }

  var wrapProvider = withHyperMask;
  _exports.wrapProvider = wrapProvider;

  function createHyperMaskSpinner() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var stop = false;
    svg.style.position = "fixed";
    svg.style.top = "10px";
    svg.style.right = "50px";
    svg.style.opacity = 0;
    svg.style.transition = "opacity 0.4s linear";
    svg.style.zIndex = "999999999";
    svg.setAttribute("class", "hypermask-loading-spinner");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", "0 0 250 200");
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    document.body.appendChild(svg);

    function h(n, key, v) {
      var id = n + key;

      if (document.getElementById(id)) {
        n = document.getElementById(id);
      } else {
        n = document.createElementNS("http://www.w3.org/2000/svg", n);
        n.setAttribute("id", id);
        svg.appendChild(n);
      }

      for (var p in v) {
        n.setAttributeNS(null, p, v[p]);
      }

      return n;
    }

    var orig_points = [[343, 114], [441, 99], [501, 129], [503, 189], [471, 244], [423, 244], [368, 230], [332, 169], [386, 177], [441, 189], [434, 134]];
    var params = [];

    for (var i = 0; i < orig_points.length; i++) {
      params.push([5 + 5 * Math.random(), 1 * Math.random(), 3 * Math.random()]);
    }

    function render() {
      if (stop) {
        svg.style.opacity = 0;
        setTimeout(function () {
          svg.remove();
        }, 500);
        return;
      }

      var points = [];
      var t = Date.now() / 400;

      for (var _i2 = 0; _i2 < orig_points.length; _i2++) {
        var d = params[_i2];
        points.push([orig_points[_i2][0] + d[0] * Math.sin(t * d[1] + d[2]) - 300, orig_points[_i2][1] + d[0] * Math.sin(t * d[1] + d[2]) - 80]);
      }

      var lines = [[0, 7], [0, 8], [8, 5], [8, 6], [5, 9], [9, 3], [9, 4], [1, 10], [10, 3], [10, 2], [10, 8], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 0]];

      for (var _i3 = 0; _i3 < lines.length; _i3++) {
        h("line", _i3, {
          x1: points[lines[_i3][0]][0],
          y1: points[lines[_i3][0]][1],
          x2: points[lines[_i3][1]][0],
          y2: points[lines[_i3][1]][1],
          stroke: "#BB6BD9",
          strokeWidth: 3
        });
      }

      for (var _i4 = 0; _i4 < points.length; _i4++) {
        h("circle", _i4, {
          cx: points[_i4][0],
          cy: points[_i4][1],
          r: 4,
          fill: "#9B51E0"
        });
      }

      requestAnimationFrame(render);
    }

    setTimeout(function () {
      svg.style.opacity = 1;
      render();
    }, 50);
    return function () {
      stop = true;
    };
  }
});
