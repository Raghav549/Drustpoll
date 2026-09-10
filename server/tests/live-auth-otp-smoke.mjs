import assert from 'node:assert/strict';

const baseUrl = (process.env.DRUSTPOLL_API_URL ?? 'https://drustpoll.onrender.com').replace(/\/$/, '');
const email = process.env.TEST_SIGNUP_EMAIL;
const username = process.env.TEST_SIGNUP_USERNAME ?? `otp_test_${Date.now().toString(36)}`;
const displayName = process.env.TEST_SIGNUP_NAME ?? 'Drustpoll OTP Smoke Test';
const password = process.env.TEST_SIGNUP_PASSWORD;

if (!email || !password) {
  console.log('SKIP: TEST_SIGNUP_EMAIL/TEST_SIGNUP_PASSWORD not set; refusing to send a real email from CI.');
  process.exit(0);
}

const response = await fetch(`${baseUrl}/v1/auth/signup`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'user-agent': 'drustpoll-live-otp-smoke/1.0' },
  body: JSON.stringify({ username, displayName, password, email }),
});

const body = await response.json().catch(() => ({}));
assert.equal(response.status, 201, `signup failed: ${response.status} ${JSON.stringify(body)}`);
assert.equal(body.verificationRequired, true, 'signup must require verification');
assert.ok(body.challengeId, 'signup must return an OTP challenge id');
assert.ok(body.token, 'signup must return a verification session token');
console.log(`PASS: live signup created verification challenge ${body.challengeId}`);
