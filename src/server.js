import Fastify from 'fastify';
import FastifyPrismaPlugin from '@joggr/fastify-prisma';

import { prisma } from './prisma.js';
import { authenticateUser } from './services/authenticateUser.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(FastifyPrismaPlugin, {
  client: prisma
});

fastify.post('/users/authenticate', async function (request, reply) {
  const { email, password } = request.body;
  
  const canAuthenticate = await authenticateUser(fastify, { email, password });

  if (!canAuthenticate) {
    return reply.status(401).send({ message: 'Cannot authenticate' });
  }

  reply.status(201).send({ message: 'Authenticated' });
});

fastify.post('/users', async function (request, reply) {
  const { email, password } = request.body;

  const user = await fastify.prisma.user.create({
    data: { email, password }
  });

  reply.send(user);
});

fastify.get('/users', async function (_, reply) {
  const users = await fastify.prisma.user.findMany();

  reply.send(users);
});

fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' })
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Server listening at ${address}`);
});
