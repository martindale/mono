# The Portal Orderbook

The Portal Orderbook is an API endpoint used to add/remove orders to buy/sell asset pairs. It features multiple order types including:

- Limit Orders (`/api/v1/orderbook/limit`)

## Endpoints

### `PUT /api/v1/orderbook/limit`

Adds a new order to the specified orderbook, and returns it to the caller.

```bash
$ curl \
    --request PUT http://localhost/api/v1/orderbook/limit \
    --header 'Content-Type: application/json' \
    --data '{
      "uid": "<unique-identifier-of-user/peer>",
      "side": "bid",
      "hash": "<hash-of-secret>",
      "baseAsset": "ETH",
      "baseQuantity": 1,
      "baseNetwork": "goerli",
      "quoteAsset": "USDC",
      "quoteQuantity": 1000,
      "quoteNetwork": "sepolia"
    }'
{
  "id":"f418d256-dd2f-4a69-89d7-dcab86e786f4",
  "ts":1665104100583,
  "uid":"<unique-identifier-of-user/peer",
  "type":"limit",
  "side":"bid",
  "hash":"<hash-of-secret>",
  "baseAsset":"ETH",
  "baseQuantity":1,
  "baseNetwork":"goerli",
  "quoteAsset":"USDC",
  "quoteQuantity":1000,
  "quoteNetwork":"sepolia"
}
```

### `DELETE /api/v1/orderbook/limit`

Deletes an existing order from the orderbook, and returns the deleted order to the caller.

```bash
$ curl \
    --request DELETE http://localhost/api/v1/orderbook/limit \
    --header 'Content-Type: application/json' \
    --data '{
      "id": "f418d256-dd2f-4a69-89d7-dcab86e786f4",
      "baseAsset": "ETH",
      "quoteAsset": "USDC"
    }'
{
  "id":"f418d256-dd2f-4a69-89d7-dcab86e786f4",
  "ts":1665104100583,
  "uid":"<unique-identifier-of-user/peer",
  "type":"limit",
  "side":"bid",
  "hash":"<hash-of-secret>",
  "baseAsset":"ETH",
  "baseQuantity":1,
  "baseNetwork":"goerli",
  "quoteAsset":"USDC",
  "quoteQuantity":1000,
  "quoteNetwork":"sepolia"
}
```
