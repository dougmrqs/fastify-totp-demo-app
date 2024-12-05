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

  const user = await fastify.prisma.user.findUnique({ 
    where: { id },
    select: { password: true, otp_secret: true }
  });

  const canAuthenticate = await authenticateUser(fastify, { email, password }, user);
  
  if (!canAuthenticate) {
    return reply.status(401).send({ message: 'Cannot authenticate' });
  }

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

fastify.get('/users/:id/totp/qrcode', async function (request, reply) {
  // WARNING: This route needs to be protected but it is not for the sake of simplicity
  const id = +request.params.id;

  const user = await fastify.prisma.user.findUnique({ 
    where: { id },
    select: { otp_secret: true }
  });

  const secret = user.otp_secret;

  const qrcode = await fastify.totp.generateQRCode({ secret });
  const imgBuffer = Buffer.from(qrcode.split(',')[1], 'base64');

  reply.type('image/png').send(imgBuffer);
});

fastify.post('/users/:id/totp/verify', async function (request, reply) {
  const { token } = request.body;
  const id = +request.params.id;

  const user = await fastify.prisma.user.findUnique({ 
    where: { id }, 
    select: { otp_secret: true }
  });

  const isValid = fastify.totp.verify({ secret: user.otp_secret, token });

  if (isValid) {
    reply.send({ message: 'Valid token' });
  }

  reply.status(401).send({ message: 'Invalid token' });
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
