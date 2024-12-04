export async function authenticateUser(fastify, userAttempt) {
  const user = await fastify.prisma.user.findFirst({
    where: { email: userAttempt.email },
    select: { password: true }
  })

  if (!user || (user.password !== userAttempt.password)) {
    return false;
  }

  return true;
}
