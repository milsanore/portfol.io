# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# THE DATABASE
- this api needs a database - we will use the postgres setup that has already been configured
- use `node-pg-migrate` as the migration library, or an alternative library that you prefer so long as it allows writing migrations using raw SQL
- create a `deployment/postgres/migrations` folder at the root of the project
- using a migration create a database called "portfolio" if it does not already exist

## THE TICK DATA TABLE MIGRATION
- we need a table for storing price time series - maybe "tick_data"?
- let's use JSONB so we don't have to deal with an ORM
- in that case, we just need two columns, id (primary key - uuid) and data (jsonb)
- no uniqueness constraints yet, the data looks non-unique

## IMPORTING TICK DATA
- create a `deployment/postgres/scripts` folder at the root of the project
- add a script for reading rows (roughly 500k) from a zip-compressed csv file in the same folder called `sample-tick-data.csv.zip` and inserting rows into the tick data table
- the content of the file looks like this:
  ```csv
  COMPANY_ID,UNIQUE_SYMBOL,TICKER_SYMBOL,COMPANY_NAME,EXCHANGE_SYMBOL,EXCHANGE_COUNTRY_ISO,PRIMARY_INDUSTRY_ID,TRADING_ITEM_ID,PRICING_DATE,PRICE_CLOSE,PRICE_CLOSE_USD,SHARES_OUTSTANDING,MARKET_CAP
  c30a1c53-873b-4e04-94be-b8153ca6e0d2,ASX:ORG,ORG,Origin Energy,ASX,AU,9510000,20164362,2026-02-04 00:00:00+00,11.120000,7.778399552322,1715933982,13347220117.402906806204
  7b89f74b-3263-4000-8d7d-6e97953d3e41,ASX:8CO,8CO,8common,ASX,AU,8010000,271019915,2026-02-04 00:00:00+00,0.027000,0.018955349621,224094903,4247797.234649081763
  7b89f74b-3263-4000-8d7d-6e97953d3e41,ASX:8CO,8CO,8common,ASX,AU,8010000,271019915,2026-02-04 00:00:00+00,0.027000,0.018863969818,224094903,4227319.486559637654
  7b89f74b-3263-4000-8d7d-6e97953d3e41,ASX:8CO,8CO,8common,ASX,AU,8010000,271019915,2026-02-04 00:00:00+00,0.027000,0.018869243134,224094903,4228501.209797146002
  ```
- keep an eye on memory footprint - can you iterate over the compressed file and decompress and read line-by-line, in order to keep memory footprint low?
- use idiomatic json names for the generated json properties
- add createdAt/updatedAt json properties

## INDEXES / INDICES
- we will search time series based on:
  - timestamp
  - timestamp + unique symbol or unique symbol + timestamp (interesting consideration re cardinality and efficiency)
- so perhaps add one composite index to the tick data table migration?


## THE PORTFOLIOS TABLE MIGRATION
- create a "trades" tables
- a portfolio can then be viewed as a set of trades (i.e. a time series of trades)
- again, JSONB -> two columns, id (primary key - uuid) and data (jsonb)
- JSONB is probably a good fit for this use-case - it will scale well, and there is low amounts of transactional work (and trades are immutable in principle)
- the trades will look something like this:
```json
{
  "user_id": "...",
  "exchange": "ASX",
  "trade_id": "...",
  "side": "buy",
  "ticker": "ASX:WBC",
  "date": "2026-02-04 00:00:00+00",
  "amount": "1",
  "price": "40.00",
  "currency": "AUD",
}
- the uniqueness constraint is based on `user_id` + `exchange` + `trade_id` in the JSONB object
```
