import { FastifyPluginCallback } from 'fastify';

export const hello: FastifyPluginCallback = (fastify) => {
  fastify.get(
    '/hello',
    {
      schema: {
        response: { 200: { $ref: 'HelloWorldResponse' } },
      },
    },
    () => {
      return { message: 'Hello, World!' };
    },
  );
};
