import { TOTP } from 'totp-generator';

const SECRET_KEY_BASE_32 = 'GFYUKYJBIE7X2N26NNKXOMZVKVDGY63B';

const { otp } = TOTP.generate(SECRET_KEY_BASE_32);

console.log(otp);
