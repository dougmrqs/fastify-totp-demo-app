export async function authenticateUser(fastify, userAttempt, user) {
  const _user = user || await fastify.prisma.user.findFirst({
    where: { email: userAttempt.email },
    select: { password: true }
  })

  const isValidPassword = checkPassword(_user, userAttempt.password);
  const isTotpValid = await checkTotp(fastify, _user, userAttempt.token);

  return isValidPassword && isTotpValid;
}

function checkPassword(user, password) {
  return user.password === password;
}

function checkTotp(fastify, user, token) {
  if (!user.otp_secret && !user.otp_verified) {
    return true;
  }

  return fastify.totp.verify({ secret: user.otp_secret, token });
}
