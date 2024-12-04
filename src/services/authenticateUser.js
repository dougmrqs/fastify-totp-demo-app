export async function authenticateUser(fastify, userAttempt, user) {
  const _user = user || await fastify.prisma.user.findFirst({
    where: { email: userAttempt.email },
    select: { password: true }
  })

  if (!_user || (_user.password !== userAttempt.password)) {
    return false;
  }

  return true;
}
