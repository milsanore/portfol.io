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


# PORTFOLIO DEFINITION
```ts
interface Portfolio {
  id: string; // UUID as a string
  customerId: string; // UUID as a string
  name: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```


# DB
- add a `portfolios` table to the database
- again, JSONB -> two columns, id (primary key - uuid) and data (jsonb)
- the id matches the id in the typescript object
- index on customer_id


# ENDPOINTS
- create the API endpoints below
- one endpoint handler per file
- endpoints are RESTful
- static schema definitions
- rely on composition over inheritance, so interfaces/types over classes
- snake_case in JSON (idiomatic)

## LIST PORTFOLIOS
- `GET /portfolios`
- needs to support filtering by customerId
- needs to support pagination

## CREATE A PORTFOLIO
- `POST /portfolios`
- needs customer id, currency, and name as inputs

## FETCH A SINGLE PORTFOLIO
- `GET /portfolios/{portfolio-uuid}`

## EDIT A PORTFOLIO
- `PATCH /portfolios/{portfolio-uuid}`
- only name and currency are mutable
