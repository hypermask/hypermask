(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define('hypermask', ['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.HyperMask = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = withHyperMask;

    Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
        "use strict";

        if (!Function.prototype.$asyncbind) {
            Object.defineProperty(Function.prototype, "$asyncbind", {
                value: $asyncbind,
                enumerable: false,
                configurable: true,
                writable: true
            });
        }

        if (!$asyncbind.trampoline) {
            $asyncbind.trampoline = function trampoline(t, x, s, e, u) {
                return function b(q) {
                    while (q) {
                        if (q.then) {
                            q = q.then(b, e);
                            return u ? undefined : q;
                        }

                        try {
                            if (q.pop) {
                                if (q.length) return q.pop() ? x.call(t) : q;
                                q = s;
                            } else q = q.call(t);
                        } catch (r) {
                            return e(r);
                        }
                    }
                };
            };
        }

        if (!$asyncbind.LazyThenable) {
            $asyncbind.LazyThenable = function () {
                function isThenable(obj) {
                    return obj && obj instanceof Object && typeof obj.then === "function";
                }

                function resolution(p, r, how) {
                    try {
                        var x = how ? how(r) : r;
                        if (p === x) return p.reject(new TypeError("Promise resolution loop"));

                        if (isThenable(x)) {
                            x.then(function (y) {
                                resolution(p, y);
                            }, function (e) {
                                p.reject(e);
                            });
                        } else {
                            p.resolve(x);
                        }
                    } catch (ex) {
                        p.reject(ex);
                    }
                }

                function Chained() {}

                ;
                Chained.prototype = {
                    resolve: _unchained,
                    reject: _unchained,
                    then: thenChain
                };

                function _unchained(v) {}

                function thenChain(res, rej) {
                    this.resolve = res;
                    this.reject = rej;
                }

                function then(res, rej) {
                    var chain = new Chained();

                    try {
                        this._resolver(function (value) {
                            return isThenable(value) ? value.then(res, rej) : resolution(chain, value, res);
                        }, function (ex) {
                            resolution(chain, ex, rej);
                        });
                    } catch (ex) {
                        resolution(chain, ex, rej);
                    }

                    return chain;
                }

                function Thenable(resolver) {
                    this._resolver = resolver;
                    this.then = then;
                }

                ;

                Thenable.resolve = function (v) {
                    return Thenable.isThenable(v) ? v : {
                        then: function (resolve) {
                            return resolve(v);
                        }
                    };
                };

                Thenable.isThenable = isThenable;
                return Thenable;
            }();

            $asyncbind.EagerThenable = $asyncbind.Thenable = ($asyncbind.EagerThenableFactory = function (tick) {
                tick = tick || typeof process === "object" && process.nextTick || typeof setImmediate === "function" && setImmediate || function (f) {
                    setTimeout(f, 0);
                };

                var soon = function () {
                    var fq = [],
                        fqStart = 0,
                        bufferSize = 1024;

                    function callQueue() {
                        while (fq.length - fqStart) {
                            try {
                                fq[fqStart]();
                            } catch (ex) {}

                            fq[fqStart++] = undefined;

                            if (fqStart === bufferSize) {
                                fq.splice(0, bufferSize);
                                fqStart = 0;
                            }
                        }
                    }

                    return function (fn) {
                        fq.push(fn);
                        if (fq.length - fqStart === 1) tick(callQueue);
                    };
                }();

                function Zousan(func) {
                    if (func) {
                        var me = this;
                        func(function (arg) {
                            me.resolve(arg);
                        }, function (arg) {
                            me.reject(arg);
                        });
                    }
                }

                Zousan.prototype = {
                    resolve: function (value) {
                        if (this.state !== undefined) return;
                        if (value === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
                        var me = this;

                        if (value && (typeof value === "function" || typeof value === "object")) {
                            try {
                                var first = 0;
                                var then = value.then;

                                if (typeof then === "function") {
                                    then.call(value, function (ra) {
                                        if (!first++) {
                                            me.resolve(ra);
                                        }
                                    }, function (rr) {
                                        if (!first++) {
                                            me.reject(rr);
                                        }
                                    });
                                    return;
                                }
                            } catch (e) {
                                if (!first) this.reject(e);
                                return;
                            }
                        }

                        this.state = STATE_FULFILLED;
                        this.v = value;
                        if (me.c) soon(function () {
                            for (var n = 0, l = me.c.length; n < l; n++) STATE_FULFILLED(me.c[n], value);
                        });
                    },
                    reject: function (reason) {
                        if (this.state !== undefined) return;
                        this.state = STATE_REJECTED;
                        this.v = reason;
                        var clients = this.c;
                        if (clients) soon(function () {
                            for (var n = 0, l = clients.length; n < l; n++) STATE_REJECTED(clients[n], reason);
                        });
                    },
                    then: function (onF, onR) {
                        var p = new Zousan();
                        var client = {
                            y: onF,
                            n: onR,
                            p: p
                        };

                        if (this.state === undefined) {
                            if (this.c) this.c.push(client);else this.c = [client];
                        } else {
                            var s = this.state,
                                a = this.v;
                            soon(function () {
                                s(client, a);
                            });
                        }

                        return p;
                    }
                };

                function STATE_FULFILLED(c, arg) {
                    if (typeof c.y === "function") {
                        try {
                            var yret = c.y.call(undefined, arg);
                            c.p.resolve(yret);
                        } catch (err) {
                            c.p.reject(err);
                        }
                    } else c.p.resolve(arg);
                }

                function STATE_REJECTED(c, reason) {
                    if (typeof c.n === "function") {
                        try {
                            var yret = c.n.call(undefined, reason);
                            c.p.resolve(yret);
                        } catch (err) {
                            c.p.reject(err);
                        }
                    } else c.p.reject(reason);
                }

                Zousan.resolve = function (val) {
                    if (val && val instanceof Zousan) return val;
                    var z = new Zousan();
                    z.resolve(val);
                    return z;
                };

                Zousan.reject = function (err) {
                    if (err && err instanceof Zousan) return err;
                    var z = new Zousan();
                    z.reject(err);
                    return z;
                };

                Zousan.version = "2.3.3-nodent";
                return Zousan;
            })();
        }

        var resolver = this;

        switch (catcher) {
            case true:
                return new $asyncbind.Thenable(boundThen);

            case 0:
                return new $asyncbind.LazyThenable(boundThen);

            case undefined:
                boundThen.then = boundThen;
                return boundThen;

            default:
                return function () {
                    try {
                        return resolver.apply(self, arguments);
                    } catch (ex) {
                        return catcher(ex);
                    }
                };
        }

        function boundThen() {
            return resolver.apply(self, arguments);
        }
    };

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    var _slicedToArray = function () {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;

            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);

                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }

            return _arr;
        }

        return function (arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var HYPERMASK_URL = 'https://hypermask.io/app';

    var HookedProvider = function () {
        function HookedProvider(base) {
            var _this = this;

            var overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            _classCallCheck(this, HookedProvider);

            this.baseProvider = base;
            this.overrides = overrides;

            var _loop = function _loop(method) {
                if (typeof base[method] === 'function' && method[0] != '_') {
                    _this[method] = function () {
                        if (method === 'send') {
                            var payload = arguments[0],
                                callback = arguments[1],
                                intercept_callback = typeof callback === 'function' ? function (err, res) {
                                if (!err && res.error) return callback(new Error(res.error.message), null);
                                callback(err, res);
                            } : callback;
                            if (this.overrides[payload.method]) {
                                return this.overrides[payload.method].apply(this, payload.params).then(function (result) {
                                    return intercept_callback(null, { jsonrpc: '2.0', id: payload.id, result: result });
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
            key: 'sendAsync',
            value: function sendAsync(payload, callback) {
                return this.send(payload, callback);
            }
        }, {
            key: '_provider_rpc',
            value: function _provider_rpc(method) {
                var _this2 = this;

                for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    params[_key - 1] = arguments[_key];
                }

                return new Promise(function (resolve, reject) {
                    return _this2.send({
                        jsonrpc: '2.0',
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

    var HyperMaskProvider = function (_HookedProvider) {
        _inherits(HyperMaskProvider, _HookedProvider);

        function HyperMaskProvider(base) {
            var overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var rpcMethods = arguments[2];
            var hyperMaskURL = arguments[3];

            _classCallCheck(this, HyperMaskProvider);

            var _this3 = _possibleConstructorReturn(this, (HyperMaskProvider.__proto__ || Object.getPrototypeOf(HyperMaskProvider)).call(this, base, overrides));

            _this3._rpcMethods = rpcMethods;
            var link = document.createElement('a');
            link.href = hyperMaskURL;
            _this3._hyperMaskURL = hyperMaskURL;
            _this3._hyperMaskOrigin = link.origin;

            _this3._rpcHandlers = {};
            _this3._channel = null;
            _this3._hyperMaskFrame = null;
            _this3._hyperMaskModal = null;
            _this3._messageListener = null;
            return _this3;
        }

        _createClass(HyperMaskProvider, [{
            key: 'reset',
            value: function reset() {
                if (this._hyperMaskModal) {
                    this._hyperMaskModal.innerHTML = '';
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
            key: '_hyper_rpc',
            value: function _hyper_rpc(method) {
                var $args = arguments;
                return new Promise(function ($return, $error) {
                    var _this4, _len2, params, _key2, stopSpinner, chain, channel, msg;

                    _this4 = this;

                    for (_len2 = $args.length, params = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                        params[_key2 - 1] = $args[_key2];
                    }

                    if (!this._hyperMaskFrame || !this._hyperMaskModal) {
                        stopSpinner = createHyperMaskSpinner();

                        return this._provider_rpc('net_version').then(function ($await_4) {
                            chain = $await_4;
                            channel = 'hm' + (Date.now() * 1000 + Math.floor(Math.random() * 1000));
                            this._channel = channel;

                            this._hyperMaskFrame = document.createElement('iframe');
                            this._hyperMaskFrame.src = this._hyperMaskURL + (this._hyperMaskURL.indexOf('?') == -1 ? '?' : '&') + 'channel=' + channel + '&chain=' + chain + '&origin=' + encodeURIComponent(window.location.origin);

                            this._hyperMaskModal = document.createElement('div');
                            this._hyperMaskModal.className = 'hypermask_modal';
                            this._hyperMaskModal.appendChild(this._hyperMaskFrame);
                            this._hyperMaskModal.style.display = 'none';
                            document.body.appendChild(this._hyperMaskModal);

                            // attach event listeners
                            this._messageListener = window.addEventListener("message", function (event) {
                                var data = event.data;
                                if (data.channel != channel || event.origin != _this4._hyperMaskOrigin) return;
                                if (data.app === 'hypermask-reply') {
                                    if (data.id in _this4._rpcHandlers) {
                                        var _rpcHandlers$data$id = _slicedToArray(_this4._rpcHandlers[data.id], 2),
                                            resolve = _rpcHandlers$data$id[0],
                                            reject = _rpcHandlers$data$id[1];

                                        data.error ? reject(data.error) : resolve(data.result);
                                        delete _this4._rpcHandlers[data.id];
                                    } else {
                                        console.warn(data.id, 'not in rpcHandlers');
                                    }
                                } else if (data.app === 'hypermask-call') {
                                    _this4._rpcMethods[data.method].apply(_this4, data.params).then(function (result) {
                                        return event.source.postMessage({ app: 'hypermask-reply', id: data.id, result: result }, _this4._hyperMaskOrigin);
                                    }).catch(function (error) {
                                        return event.source.postMessage({ app: 'hypermask-reply', id: data.id, error: error }, _this4._hyperMaskOrigin);
                                    });
                                }
                            }, false);

                            return new Promise(function (resolve, reject) {
                                _this4._hyperMaskFrame.onload = resolve;
                                _this4._hyperMaskFrame.onerror = reject;
                            }).then(function ($await_5) {

                                stopSpinner();
                                return $If_3.call(this);
                            }.$asyncbind(this, $error), $error);
                        }.$asyncbind(this, $error), $error);
                    }

                    function $If_3() {
                        msg = {
                            app: 'hypermask-call',
                            id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
                            method: method,
                            params: params
                        };
                        this._hyperMaskFrame.contentWindow.postMessage(msg, this._hyperMaskOrigin);
                        return new Promise(function (resolve, reject) {
                            _this4._rpcHandlers[msg.id] = [resolve, reject];
                        }).then($return, $error);
                    }

                    return $If_3.call(this);
                }.$asyncbind(this));
            }
        }]);

        return HyperMaskProvider;
    }(HookedProvider);

    var rpcMethods = {
        setStyle: function setStyle(style) {
            return new Promise(function ($return, $error) {
                this._hyperMaskModal.setAttribute('style', style);
                return $return();
            }.$asyncbind(this));
        },
        insertStylesheet: function insertStylesheet(sheet) {
            return new Promise(function ($return, $error) {
                var style = document.createElement('style');
                style.type = 'text/css';
                style.innerHTML = sheet;
                document.getElementsByTagName('head')[0].appendChild(style);
                return $return();
            }.$asyncbind(this));
        },
        closeModal: function closeModal() {
            return new Promise(function ($return, $error) {
                this._hyperMaskModal.style.animationName = 'hypermask-exit-animation';
                return new Promise(function (resolve) {
                    return setTimeout(resolve, 500);
                }).then(function ($await_7) {
                    this._hyperMaskModal.style.display = 'none';
                    return $return();
                }.$asyncbind(this, $error), $error);
            }.$asyncbind(this));
        },
        relayProvider: function relayProvider(method) {
            var $args = arguments;
            return new Promise(function ($return, $error) {
                var _len3, params, _key3;

                for (_len3 = $args.length, params = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    params[_key3 - 1] = $args[_key3];
                }

                return this._provider_rpc.apply(this, [method].concat(_toConsumableArray(params))).then($return, $error);
            }.$asyncbind(this));
        }
    };

    var providerHooks = {
        eth_coinbase: function eth_coinbase() {
            return new Promise(function ($return, $error) {
                return this._provider_rpc('eth_accounts').then(function ($await_9) {
                    return $return($await_9[0]);
                }.$asyncbind(this, $error), $error);
            }.$asyncbind(this));
        },
        eth_accounts: function eth_accounts() {
            return new Promise(function ($return, $error) {
                return this._hyper_rpc('eth_accounts').then($return, $error);
            }.$asyncbind(this));
        },
        eth_sendTransaction: function eth_sendTransaction(txParams) {
            return new Promise(function ($return, $error) {
                return this._hyper_rpc('eth_sendTransaction', txParams).then($return, $error);
            }.$asyncbind(this));
        },
        personal_sign: function personal_sign(message, from) {
            return new Promise(function ($return, $error) {
                return this._hyper_rpc('personal_sign', message, from).then($return, $error);
            }.$asyncbind(this));
        },
        eth_sign: function eth_sign(from, message) {
            return new Promise(function ($return, $error) {
                return this._hyper_rpc('eth_sign', from, message).then($return, $error);
            }.$asyncbind(this));
        },
        eth_signTypedData: function eth_signTypedData(message, from) {
            var $args = arguments;
            return new Promise(function ($return, $error) {
                var extraParams;
                extraParams = $args.length > 2 && $args[2] !== undefined ? $args[2] : {};
                return this._hyper_rpc('eth_signTypedData', message, from, extraParams).then($return, $error);
            }.$asyncbind(this));
        }
    };

    function withHyperMask(provider) {
        var hyperMaskURL = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : HYPERMASK_URL;

        return new HyperMaskProvider(provider, providerHooks, rpcMethods, hyperMaskURL);
    }

    var wrapProvider = exports.wrapProvider = withHyperMask;

    function createHyperMaskSpinner() {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var stop = false;
        svg.style.position = 'fixed';
        svg.style.top = '10px';
        svg.style.right = '50px';
        svg.style.opacity = 0;
        svg.style.transition = 'opacity 0.4s linear';
        svg.style.zIndex = '999999999';
        svg.setAttribute('class', 'hypermask-loading-spinner');
        svg.setAttribute('width', '100');
        svg.setAttribute('height', '100');
        svg.setAttribute('viewBox', "0 0 250 200");
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        document.body.appendChild(svg);

        function h(n, key, v) {
            var id = n + key;
            if (document.getElementById(id)) {
                n = document.getElementById(id);
            } else {
                n = document.createElementNS("http://www.w3.org/2000/svg", n);
                n.setAttribute('id', id);
                svg.appendChild(n);
            }
            for (var p in v) {
                n.setAttributeNS(null, p, v[p]);
            }return n;
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
                h('line', _i3, {
                    x1: points[lines[_i3][0]][0],
                    y1: points[lines[_i3][0]][1],
                    x2: points[lines[_i3][1]][0],
                    y2: points[lines[_i3][1]][1],
                    stroke: '#BB6BD9',
                    strokeWidth: 3
                });
            }
            for (var _i4 = 0; _i4 < points.length; _i4++) {
                h('circle', _i4, {
                    cx: points[_i4][0],
                    cy: points[_i4][1],
                    r: 4,
                    fill: '#9B51E0'
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
