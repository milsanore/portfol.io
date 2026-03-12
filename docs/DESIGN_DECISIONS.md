# DESIGN DECISIONS

itemising some of the decisions i made as i put this codebase together.

# LANGUAGE
- i've decided to go with typescript
- alternatively, for some hand-cut async/await/event-loop python with typing (via MyPy) and good performance, please take a look at my github repo https://github.com/milsanore/bi5importer
- for additional performance improvement on the python side, a JIT compiler like PyPy could work, but it was a diminishing return for the repo above because the code is IO-heavy, so the bulk of the improvement was in the event loop / async work

# LIBRARIES
- i'm moving from express to fastify to see what performance is like
