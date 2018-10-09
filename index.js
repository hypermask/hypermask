const HYPERMASK_CONFIG = {
  url: "https://app.hypermask.io/"
}

class HookedProvider {
  constructor(base, overrides = {}) {
    this.baseProvider = base;
    this.overrides = overrides;
    for (let method in base) {
      if (typeof base[method] === "function" && method[0] != "_" && method !== 'send' && method !== 'sendAsync') {
        this[method] = function() {
          return this.baseProvider[method].apply(this.baseProvider, arguments);
        };
      }
    }
  }

  send(payload, callback){
    let intercept_callback =
        typeof callback === "function"
          ? function(err, res) {
              if (!err && res.error) return callback(new Error(res.error.message), null);
              callback(err, res);
            }
          : callback;
    if (this.overrides[payload.method]) {
      return this.overrides[payload.method]
        .apply(this, payload.params)
        .then(result =>
          intercept_callback(null, {
            jsonrpc: "2.0",
            id: payload.id,
            result: result
          })
        )
        .catch(error => intercept_callback(error, null));
    } else if(this.baseProvider.sendAsync){
      return this.baseProvider.sendAsync(payload, intercept_callback);
    }else{
      return this.baseProvider.send(payload, intercept_callback);
    }
  }

  sendAsync(payload, callback) {
    return this.send(payload, callback);
  }

  _provider_rpc(method, ...params) {
    return new Promise((resolve, reject) =>
      this.send(
        {
          jsonrpc: "2.0",
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          method: method,
          params: params
        },
        (err, result) => (err ? reject(err) : resolve(result.result))
      )
    );
  }
}

class HyperMaskProvider extends HookedProvider {
  constructor(base, overrides = {}, rpcMethods, config) {
    super(base, overrides);
    this.isHyperMask = true;
    this._rpcMethods = rpcMethods;
    
    config = { ...HYPERMASK_CONFIG, ...(typeof config === 'string' ? 
        { url: config } : (config || {})) }

    let link = document.createElement("a");
    link.href = config.url;
    this._hyperMaskURL = config.url;
    this._hyperMaskOrigin = link.origin;
    this._hyperMaskConfig = config

    this._rpcHandlers = {};
    this._channel = null;
    this._hyperMaskFrame = null;
    this._hyperMaskModal = null;
    this._messageListener = null;

    this.initializeFrame();
  }

  async initializeFrame() {
    // initializeFrame is idempotent, so it does not act if the
    // frame has already been initialized
    if(this._framePromise){
      return await this._framePromise
    }else{
      return await (this._framePromise = this._initializeFrame())
    }
  }

  async _initializeFrame() {
    let stopSpinner = createHyperMaskSpinner();
    let channel = "hm" + (Date.now() * 1000 + Math.floor(Math.random() * 1000));
    this._channel = channel;
    this._hyperMaskFrame = document.createElement("iframe");
    let chain = await this._provider_rpc("net_version");
    this._hyperMaskFrame.src =
      this._hyperMaskURL +
      (this._hyperMaskURL.indexOf("?") == -1 ? "?" : "&") +
      "channel=" +
      channel +
      "&chain=" +
      chain +
      "&origin=" +
      encodeURIComponent(window.location.origin) +
      "&config=" + encodeURIComponent(JSON.stringify(this._hyperMaskConfig));

    this._hyperMaskModal = document.createElement("div");
    this._hyperMaskModal.className = "hypermask_modal";
    this._hyperMaskModal.appendChild(this._hyperMaskFrame);
    this._hyperMaskModal.style.display = "none";
    document.body.appendChild(this._hyperMaskModal);

    // attach event listeners
    this._messageListener = window.addEventListener(
      "message",
      event => {
        let data = event.data;
        if (data.channel != this._channel) {
          console.warn("Unrecognized data channel.");
          return;
        }
        if (event.origin != this._hyperMaskOrigin) {
          console.warn("Improper request origin.");
          return;
        }
        if (data.app === "hypermask-reply") {
          if (data.id in this._rpcHandlers) {
            let [resolve, reject] = this._rpcHandlers[data.id];
            data.error ? reject(data.error) : resolve(data.result);
            delete this._rpcHandlers[data.id];
          } else {
            console.warn(data.id, "not in rpcHandlers");
          }
        } else if (data.app === "hypermask-call") {
          this._rpcMethods[data.method]
            .apply(this, data.params)
            .then(result =>
              event.source.postMessage(
                {
                  app: "hypermask-reply",
                  id: data.id,
                  result: result
                },
                this._hyperMaskOrigin
              )
            )
            .catch(error => {
              event.source.postMessage(
                {
                  app: "hypermask-reply",
                  id: data.id,
                  error: error.message
                },
                this._hyperMaskOrigin
              );
            });
        }
      },
      false
    );

    await new Promise((resolve, reject) => {
      this._hyperMaskFrame.onload = resolve;
      this._hyperMaskFrame.onerror = reject;
    });

    stopSpinner();
  }

  reset() {
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

  async _hyper_rpc(method, ...params) {
    await this.initializeFrame();
    let msg = {
      app: "hypermask-call",
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      method: method,
      params: params
    };
    this._hyperMaskFrame.contentWindow.postMessage(msg, this._hyperMaskOrigin);
    return await new Promise((resolve, reject) => {
      this._rpcHandlers[msg.id] = [resolve, reject];
    });
  }
}

const rpcMethods = {
  async setStyle(style) {
    this._hyperMaskModal.setAttribute("style", style);
  },
  async insertStylesheet(sheet) {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = sheet;
    document.getElementsByTagName("head")[0].appendChild(style);
  },
  async closeModal() {
    this._hyperMaskModal.style.animationName = "hypermask-exit-animation";
    await new Promise(resolve => setTimeout(resolve, 500));
    this._hyperMaskModal.style.display = "none";
  },
  async relayProvider(method, ...params) {
    return await this._provider_rpc(method, ...params);
  }
};

const providerHooks = {
  // override eth_coinbase to return the first result of eth_accounts
  async eth_coinbase() {
    return (await this._provider_rpc("eth_accounts"))[0];
  },
  async eth_accounts() {
    return await this._hyper_rpc("eth_accounts");
  },
  async eth_sendTransaction(txParams) {
    return await this._hyper_rpc("eth_sendTransaction", txParams);
  },
  async personal_sign(message, from) {
    return await this._hyper_rpc("personal_sign", message, from);
  },
  async eth_sign(from, message) {
    return await this._hyper_rpc("eth_sign", from, message);
  },
  async eth_signTypedData(message, from, extraParams = {}) {
    return await this._hyper_rpc("eth_signTypedData", message, from, extraParams);
  }
};

export default function withHyperMask(provider, hyperMaskConfig = null) {
  return new HyperMaskProvider(provider, providerHooks, rpcMethods, hyperMaskConfig);
}

export const wrapProvider = withHyperMask;

function createHyperMaskSpinner() {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let stop = false;
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
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  document.body.appendChild(svg);

  function h(n, key, v) {
    let id = n + key;
    if (document.getElementById(id)) {
      n = document.getElementById(id);
    } else {
      n = document.createElementNS("http://www.w3.org/2000/svg", n);
      n.setAttribute("id", id);
      svg.appendChild(n);
    }
    for (var p in v) n.setAttributeNS(null, p, v[p]);
    return n;
  }

  let orig_points = [
    [343, 114],
    [441, 99],
    [501, 129],
    [503, 189],
    [471, 244],
    [423, 244],
    [368, 230],
    [332, 169],
    [386, 177],
    [441, 189],
    [434, 134]
  ];
  let params = [];
  for (let i = 0; i < orig_points.length; i++) {
    params.push([5 + 5 * Math.random(), 1 * Math.random(), 3 * Math.random()]);
  }

  function render() {
    if (stop) {
      svg.style.opacity = 0;
      setTimeout(function() {
        svg.remove();
      }, 500);
      return;
    }
    let points = [];
    let t = Date.now() / 400;

    for (let i = 0; i < orig_points.length; i++) {
      let d = params[i];
      points.push([
        orig_points[i][0] + d[0] * Math.sin(t * d[1] + d[2]) - 300,
        orig_points[i][1] + d[0] * Math.sin(t * d[1] + d[2]) - 80
      ]);
    }

    let lines = [
      [0, 7],
      [0, 8],
      [8, 5],
      [8, 6],
      [5, 9],
      [9, 3],
      [9, 4],
      [1, 10],
      [10, 3],
      [10, 2],
      [10, 8],
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 0]
    ];

    for (let i = 0; i < lines.length; i++) {
      h("line", i, {
        x1: points[lines[i][0]][0],
        y1: points[lines[i][0]][1],
        x2: points[lines[i][1]][0],
        y2: points[lines[i][1]][1],
        stroke: "#BB6BD9",
        strokeWidth: 3
      });
    }
    for (let i = 0; i < points.length; i++) {
      h("circle", i, {
        cx: points[i][0],
        cy: points[i][1],
        r: 4,
        fill: "#9B51E0"
      });
    }
    requestAnimationFrame(render);
  }
  setTimeout(function() {
    svg.style.opacity = 1;
    render();
  }, 50);
  return function() {
    stop = true;
  };
}
