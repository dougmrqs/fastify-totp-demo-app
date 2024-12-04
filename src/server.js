import Fastify from 'fastify';
import FastifyPrismaPlugin from '@joggr/fastify-prisma';
import FastifyTotpPlugin from 'fastify-totp';

import { prisma } from './prisma.js';
import { authenticateUser } from './services/authenticateUser.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(FastifyPrismaPlugin, {
  client: prisma
});

fastify.register(FastifyTotpPlugin)

fastify.post('/users/:id/totp', async function (request, reply) {
  const { email, password } = request.body;
  const id = +request.params.id;

  const canAuthenticate = await authenticateUser(fastify, { id, email, password });
  
  if (!canAuthenticate) {
    return reply.status(401).send({ message: 'Cannot authenticate' });
  }

  const user = await fastify.prisma.user.findUnique({ 
    where: { id }, 
    select: { otp_secret: true } 
  });

  if (!user.otp_secret || !user.otp_verified) { 
    const secret = fastify.totp.generateSecret();
    
    await fastify.prisma.user.update({
      where: { id }, 
      data: { otp_secret: secret.ascii, otp_verified: false } 
    });

    reply.status(201).send({ secret });
  }

  reply.status(403);
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
