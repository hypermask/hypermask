# HyperMask

[![npm version](https://badge.fury.io/js/hypermask.svg)](https://badge.fury.io/js/hypermask)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![HyperMask Logo](https://hypermask.io/favicon.ico)

> Home Page: https://hypermask.io/
>
> Live Demo (Main Net): https://hypermask.io/demo?chain=mainnet
>
> Live Demo (Ropsten Test Net): https://hypermask.io/demo?chain=ropsten

HyperMask lets users without MetaMask, Parity, or Mist installed still participate in the decentralized app party. App developers can add just six lines of code, and let any visitor to their DApp send and recieve payments, execute smart contracts, and sign messages.

When a user does an action which requires payment, HyperMask uses Coinbase's Buy Widget to securely accept credit card or bank account information. There's no need for the user to sign up for any accounts — just an email address and credit card. We don't take any fees for processing transactions (and in fact we can't).

Behind the scenes, HyperMask provisions a local in-browser wallet, which recieves and forwards the funds from Coinbase. The wallet's keys are kept in your browser and are never sent over the internet. This wallet is fully functional, and can be used to collect micropayments, trade tokens, and sign messages.

## Quick Start

If you're developing a decentralized app powered by Ethereum's Web3 framework, integrating HyperMask can be as easy as adding six lines of code.

The entire HyperMask library is under 300 lines of Javascript, with no dependencies, so you don't have to worry about HyperMask bloating up your app.

```js
import Web3 from "web3";
import withHyperMask from "hypermask";

// if web3 is already defined, the user probably is using MetaMask or Mist
// in this case, use the existing Web3 provider instead of HyperMask
if (typeof web3 !== "undefined") {
  window.web3 = new Web3(web3.currentProvider);
} else {
  window.web3 = new Web3(
    withHyperMask(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws"))
  );
}
```

Your app built with the [Web3 1.0 API](http://web3js.readthedocs.io/en/1.0/index.html) should then _just work_. If your browser already injects a Web3 provider (e.g. MetaMask or Toshi) HyperMask doesn't get in the way.

You can find more detailed instructions and examples in the "Getting Started" section of this README and at the [hypermask-examples](https://github.com/hypermask/hypermask-examples) repo.

You can find a React-based example on [CodeSandbox](https://codesandbox.io/s/450zxpzl4) and a vanilla HTML/JS example on [CodePen](https://codepen.io/hypermask/pen/gvadRv/left/?editors=1010),

## How It Works

![How HyperMask Works](https://hypermask.io/how-it-works.svg)

## Getting Started

#### Using a bundler

Just add the HyperMask dependency to your project with `npm` or `yarn`

    npm install hypermask

Wrap your `WebsocketProvider` or `HttpProvider` fallback with the `withHyperMask` decorator, and everything will just work.

```javascript
import Web3 from "web3";
import withHyperMask from "hypermask";

window.web3 = new Web3(
  withHyperMask(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws"))
);
```

Check out a full React-based example on [CodeSandbox](https://codesandbox.io/s/81ooko0qnl).

#### Vanilla JS/HTML

Import HyperMask with a plain ol' script tag:

```html
<script src="https://unpkg.com/hypermask@1/dist/index.js"></script>
```

Then wrap your Web3 `WebsocketProvider` or `HttpProvider` instance with the `HyperMask.wrapProvider` decorator like so:

```html
<script src="https://cdn.rawgit.com/ethereum/web3.js/1.0/dist/web3.min.js"></script>
<script src="https://unpkg.com/hypermask@1/dist/index.js"></script>
<script>
if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider);
} else {
    window.web3 = new Web3(HyperMask.wrapProvider(new Web3.providers.HttpProvider("https://mainnet.infura.io/")));
}
</script>
```

Check out a full example on [CodePen](https://codepen.io/hypermask/pen/gvadRv/left/?editors=1010)

## Configuration

HyperMask automatically uses whatever network you pass in as a provider. To use the Ethereum MainNet, just use the `mainnet` INFURA JSON-RPC endpoint.

    window.web3 = new Web3(HyperMask.wrapProvider(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws")));

To use the Ropsten testnet, just use the `ropsten` endpoint.

    window.web3 = new Web3(HyperMask.wrapProvider(new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws")));

HyperMask uses the same address across all of a user's applications. That way if you earn money from one game, you can use the resulting funds in another one.

The HyperMask client library (this project!) exposes a single function. If importing by script tag, it's accessible by `HyperMask.wrapProvider` and by NPM/Webpack/Parcel/Browserify it's accessible by `withHyperMask` (or whatever you choose to call it).

The first argument is a Web3 provider that you're wrapping. HyperMask intercepts all account-related methods sent to the provider, so you should not wrap the injected `web3.currentProvider` object. Instead you should wrap a public provider such as INFURA.

`withHyperMask` has an optional second argument for the URL of the HyperMask wallet frame. By default it points to `https://app.hypermask.io/`, but may be useful to override during development.

## Security

HyperMask maintains a local Ethereum wallet in your browser— its private keys never leave your computer. Funds are briefly sent from Coinbase to your HyperMask wallet, after which the funds are immediately spent on the requested transaction. Value may be left over in your HyperMask wallet due to changes in Ethereum's price during the purchase process, or if a transaction fails and gets refunded by the network, or if ETH is sent to your wallet address (for instance from contract earnings).

As your HyperMask wallet is accessible to anyone with physical access to your computer, you should not use Hypermask to hold substantial amounts of ether. Think of HyperMask's wallet as a pocket for storing loose change, rather than a bank vault for storing valuable assets. We've done our best to ensure that your funds are reasonably secure, but are not responsible for any loss.

Since HyperMask uses the same account information across websites, malicious sites may be able to use it as a cross-domain drive-by tracking cookie. This is the same behavior of MetaMask and most other Ethereum wallets. This default behavior can be changed by navigating to the Hypermask Wallet Settings page at https://app.hypermask.io (for mainnet) or https://app.hypermask.io/?chain=ropsten (for ropsten testnet) and enabling "Require approval before sharing identity with decentralized apps".

By default, HyperMask collects anonymous usage statistics using Google Analytics. Likewise there is a setting in the wallet settings page which completely disables the use of Google Analytics.

## Donate

We're committed to the security of our users and developers. Users are in full control of their own wallets. This means that we can't tack on additional transaction fees and have to depend on donations.

Because of our dedication to security, no less than 10% of donations will go toward starting a bug bounty program. The rest of the funds will be used to support the ongoing development of HyperMask.

```
ETH: 0x4c020de581b98292f1cce93698a1fec462b0c4d2
```
