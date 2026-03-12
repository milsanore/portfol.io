import Fastify, { FastifyInstance } from 'fastify';
import schema from './schema.json';

export function buildApp(): FastifyInstance {
  const fastify = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  fastify.addSchema(schema);

  const isValidateResponses = process.env.ENABLE_RESPONSE_VALIDATION === 'true';

  fastify.get(
    '/hello',
    {
      schema: {
        response: isValidateResponses
          ? {
              200: { $ref: 'portfol-io#/definitions/HelloWorldResponse' },
            }
          : undefined,
      },
    },
    () => {
      return { message: 'Hello, World!' };
    },
  );

  return fastify;
}
