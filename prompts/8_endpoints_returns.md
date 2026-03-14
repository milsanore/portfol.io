# PORTFOLIO RETURN ALGORITHM
- you are welcome to review literature
- i would suggest to calculate portfolio return as the percentage change in portfolio value: (portfolio-value(end) - portfolio-value(start)) / portfolio-value(start)
- keep in mind that we have a close-price time series in the database, in the `tick_data` table
- the 'end' value of a stock is the most recent close price available, which may not be the current date
- if no tick data exists after a stock was purchased, assume spot price = average purchase price. i.e. return zero profit for that stock
- suggestions:
  - start value: sum of all positions (number of shares x purchase price)
  - end value: sum of all positions (number of shares x latest close price from tick_data)
  - return: a single percentage representing the portfolio return


# ENDPOINTS
- create the API endpoints below
- one endpoint handler per file
- endpoints are RESTful
- static schema definitions
- rely on composition over inheritance, so interfaces/types over classes
- snake_case property names in JSON API responses (idiomatic?)


## GET-PORTFOLIO-RETURN
- `GET portfolios/{portfolio-uuid}/return`
- inputs are start date and end date
- end date is optional - default to 'now'
- since it seems like a few methods exist to calculate portfolio return, the selected mechanism should be made explicit through an optional (i.e. defaultable) parameter (e.g. `&algorithm=SVE` - i.e. start-vs-end)
- memory considerations -> db-pagination/iteration/generator
- the DB tick_data table should already be indexed, but check




- start_value = total buy cost basis: sum(buy_amount × buy_price)
- end_value = realized cash from sells + unrealized value of remaining shares:
  - realized: sum(sell_amount × sell_price)
  - unrealized: net_shares × latest_close_price (where net_shares = total_bought - total_sold per ticker)
- return = (end_value - start_value) / start_value

Example: buy 100 @ $10 ($1000 in), sell 50 @ $15 ($750 cash out), remaining 50 @ $20 ($1000 unrealized) → end_value = $1750, return
  = 75%.