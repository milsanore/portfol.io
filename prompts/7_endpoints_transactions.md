# INTRO
```
Quant Engineering Manager
The challenge
● Design an API that allows you to manage portfolios and transactions within a portfolio.
● Provide a function that calculates portfolio return for a given period of time.
What do we provide?
We provide a dataset with ASX ticker prices for a period of time.
What do we expect?
● Describe what the API looks like.
● Provide as much detail as possible for future scalability and shortcuts that you have taken
● Provide a function that calculates the portfolio return given a period of time
Some definitions
● A transaction consists of the following fields (for simplification): transaction type
(buy/sell), ticker, date, amount, price and currency
● We recommend using Python or Typescript for the implementation.
Other considerations
● The challenge shouldn’t take you more than 2h
● Please describe any shortcuts or future possible implementations
● You can use AI, we’d like to hear how you use it.
```


# TRANSACTION DEFINITION
```ts
type Side = 'buy' | 'sell'; // Custom type for transaction sides, can be made more aggressive if necessary

interface Transaction {
  id: string; // UUID as a string
  portfolioId: string; // UUID as a string
  ticker: string;
  side: Side;
  amount: number;
  price: number;
  currency: string;
  exchange?: string;        // optional - in case the transaction is manually entered via UI
  transactionId?: string;   // optional - ...
  date?: Date;              // optional - ...
  created_at: Date;
  updated_at: Date;
}
```


# DB
- transactions are persisted in the `transactions` table in the database
- the id matches the id in the typescript object
- `"data"->>'portfolio_id'` is foreign-keyed to `portfolio.id`
- snake_case (idiomatic?) property names in JSONB
- use prepared statements for DB operations if possible, for performance

# TRANSACTION ENDPOINTS
- create the API endpoints below
- one endpoint handler per file
- endpoints are RESTful
- static schema definitions
- rely on composition over inheritance, so interfaces/types over classes
- snake_case property names in JSON API responses (idiomatic?)

## LIST TRANSACTIONS
- `GET api/portfolios/{portfolio-uuid}/transactions`
- i.e. fetch the transactions for a portfolio
- needs pagination
- needs to support filtering by date range
- may require an additional database index
  - perhaps a composite index - `portfolio_id` + `date` ?
  - since `date` is optional, may need to fall back to `created_at`

## CREATE A TRANSACTION
- `POST api/portfolios/{portfolio-uuid}/transactions`
- needs:
```json
{
  "ticker": "string",
  "side": "Side",
  "amount": "number",
  "price": "number",
  "currency": "string",
  "exchange": "string",       // optional - in case the transaction is manually entered via UI
  "transaction_id": "string", // optional - ...
  "date": "Date",             // optional - ...
}
```

## FETCH A SINGLE TRANSACTION
- `GET api/portfolios/{portfolio-uuid}/transactions/{transaction-uuid}`

## EDIT A TRANSACTION
- `PATCH api/portfolios/{portfolio-uuid}/transactions/{transaction-uuid}`
- only name and currency are mutable
- ticker, side, amount, prince, currency, exchange, transaction_id, date, are all mutable
