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


# CALCULATING PORTFOLIO RETURNS
- keep in mind that we have a close-price time series in the database, in the `tick_data` table.


# ENDPOINTS
- create the API endpoints below
- one endpoint handler per file
- endpoints are RESTful
- static schema definitions
- rely on composition over inheritance, so interfaces/types over classes
- snake_case in JSON (idiomatic)


# ENDPOINT
- `GET api/portfolios/{uuid}/return`
- inputs are start date and end date
- end date is optional, can default to 'now'
- the aim is to get the totality
- memory considerations -> iteration/generator



# THOUGHTS
- if we don't have tick data, return a zero return (i.e. spot price == trade price)
