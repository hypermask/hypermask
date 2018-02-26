# HyperMask


> Home Page: https://hypermask.io/
>
> Live Demo (Main Net): https://hypermask.io/demo?chain=mainnet
> 
> Live Demo (Ropsten Test Net): https://hypermask.io/demo?chain=ropsten

[![npm version](https://badge.fury.io/js/hypermask.svg)](https://badge.fury.io/js/hypermask)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


HyperMask lets users without native Web3-enabled browsers come and join the decentralized app party. With just two new lines of code all of your users can send and recieve payments, execute smart contracts, and sign messages. When a user does an action which requires payment, HyperMask uses Coinbase's Buy Widget to securely accept credit card or bank account information. HyperMask provisions a local in-browser wallet, which then recieves the Coinbase funds and then signs and broadcasts the transaction. 

The HyperMask library is under 200 lines of Javascript, with no dependencies. Wrap your `HttpProvider` fallback with the `withHyperMask` decorator, and everything will just work.

Check out this simple example on [CodeSandbox](https://codesandbox.io/s/81ooko0qnl)

```js
import Web3 from 'web3'
import withHyperMask from 'hypermask'

if (typeof web3 !== 'undefined') {
    global.web3 = new Web3(web3.currentProvider);
} else {
    global.web3 = new Web3(withHyperMask(new Web3.providers.HttpProvider("https://mainnet.infura.io/")));
}
```


If you're building your app in plain HTML and Javascript without a module bundler like Webpack, Browserify, or Parcel. You can use the following script tag includes:

Check out this simple example on [CodePen](https://codepen.io/hypermask/pen/gvadRv/left/?editors=1010)

```html
<script src="https://cdn.rawgit.com/ethereum/web3.js/1.0/dist/web3.min.js"></script>
<script src="https://unpkg.com/hypermask@1.0.0/dist/index.js"></script>
<script>
if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider);
} else {
    window.web3 = new Web3(HyperMask.wrapProvider(new Web3.providers.HttpProvider("https://mainnet.infura.io/")));
}
</script>
```

Your app built with the [Web3 1.0 API](http://web3js.readthedocs.io/en/1.0/index.html) should then *just work*. If your browser already injects a Web3 provider (e.g. MetaMask or Toshi) HyperMask doesn't get in the way. 

# Switching Networks

HyperMask automatically uses whatever network you pass in as a provider. To use the Ethereum MainNet, just use the `mainnet` INFURA JSON-RPC endpoint. To use the Ropsten testnet, just use the `ropsten` endpoint. HyperMask uses the same address for all chains, and across all of a user's applications. That way if you earn money from one game, you can use the resulting funds in another one.



# Security

HyperMask maintains a local Ethereum wallet in your browser— its private keys never leave your computer. Funds are briefly sent from Coinbase to your HyperMask wallet, after which the funds are immediately spent on the requested transaction. Value may be left over in your HyperMask wallet due to changes in Ethereum's price during the purchase process, or if a transaction fails and gets refunded by the network, or if ETH is sent to your wallet address (for instance from contract earnings).

As your HyperMask wallet is accessible to anyone with physical access to your computer, you should not use Hypermask to hold substantial amounts of ether. Think of HyperMask's wallet as a pocket for storing loose change, rather than a bank vault for storing valuable assets. We've done our best to ensure that your funds are reasonably secure, but are not responsible for any loss. 

Since HyperMask uses the same account information across websites, malicious sites may be able to use it as a cross-domain drive-by tracking cookie. This is the same behavior of MetaMask and most other Ethereum wallets. This default behavior can be changed by navigating to the Hypermask Wallet Settings page at https://hypermask.io/app (for mainnet) or https://hypermask.io/app/?chain=ropsten (for ropsten testnet) and enabling "Require approval before sharing identity with decentralized apps". 

By default, HyperMask collects anonymous usage statistics using Google Analytics. Likewise there is a setting in the wallet settings page which completely disables the use of Google Analytics.





