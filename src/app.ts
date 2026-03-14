import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import schemas from './schemas.json';
import { hello } from './endpoints/hello';
import { listPortfolios } from './endpoints/portfolios/list';
import { createPortfolio } from './endpoints/portfolios/create';
import { getPortfolio } from './endpoints/portfolios/get';
import { updatePortfolio } from './endpoints/portfolios/update';
import { listTransactions } from './endpoints/transactions/list';
import { createTransaction } from './endpoints/transactions/create';
import { getTransaction } from './endpoints/transactions/get';
import { updateTransaction } from './endpoints/transactions/update';
import { getPortfolioReturn } from './endpoints/portfolios/return';

export function buildApp(): FastifyInstance {
  const fastify = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  fastify.register(swagger, {
    openapi: {
      info: { title: 'portfol.io API', version: '0.9.0' },
    },
  });

  fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  for (const schema of schemas) {
    fastify.addSchema(schema);
  }

  fastify.register(hello);
  //
  fastify.register(listPortfolios);
  fastify.register(createPortfolio);
  fastify.register(getPortfolio);
  fastify.register(updatePortfolio);
  fastify.register(getPortfolioReturn);
  //
  fastify.register(listTransactions);
  fastify.register(createTransaction);
  fastify.register(getTransaction);
  fastify.register(updateTransaction);

  return fastify;
}
