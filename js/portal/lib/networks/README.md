# networks

Listed here are all of the supported blockchain networks, each expressed as a sub-class of [`Network`](../core/network.js "The base class for all supported blockchain networks"). These provide the necessary implementation specifics for each supported network, be it an L1 or L2.

## API

### `.[network]`

All supported blockchain network instances are available as properties on a `Networks` instance.

```
networks.goerli // The Goerli `Network` instance
networks.sepolia // The Sepolia `Network` instance
```

### `.isSupported (network)`

Returns `true` or `false` based on whether or not the specified blockchain network is supported.

```
networks.isSupported('goerli')    // returns true
networks.isSupported('ropsten')   // returns false
```

### `.SUPPORTED`

Returns a list of supported blockchain networks.

```
networks.SUPPORTED    // ['goerli', 'sepolia']
```

### `.byAssets`

Returns a `Map` keyed by the symbol of an `Asset`, whose value is another `Map` of `Network` instances that support the `Asset`, keyed by the names of the networks.

```
networks.byAssets('ETH')  // Map(2) {'goerli' => {...}, 'sepolia' => { ... } }
```
