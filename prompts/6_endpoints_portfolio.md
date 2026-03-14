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
