# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# ENDPOINTS
- one endpoint per file

GET api/portfolios (list portfolios)
GET api/portfolios/id (fetch a single portfolio, may need pagination?)
GET api/portfolios/id/return (calculate portfolio return)

```json

{
  "side": "buy",
  "ticker": "ASX:WBC",
  "date": "2026-02-04 00:00:00+00",
  "amount": "1",
  "price": "40.00",
  "currency": "AUD"
}
```

min date in csv:
max date in csv:

rely on composition over inheritance, so interfaces/types over classes
