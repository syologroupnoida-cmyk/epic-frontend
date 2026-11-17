const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const swc = require('next/dist/build/swc');

const unverifiedMessage = 'Email not verified. We have sent a new verification code to your inbox.';
const apiError = (message) => ({ response: { status: 400, data: { message } } });

// Exercise the page's event handlers and rendered modal props without live accounts.
function harness() {
  const state = [];
  let cursor = 0;
  const calls = [];
  const routes = [];
  const tokens = [];
  const users = [];
  const handlers = {
    '/auth/login': async () => { throw apiError(unverifiedMessage); },
    '/auth/verify-email': async () => ({ data: { success: true } }),
    '/auth/resend-otp': async () => ({ data: { message: 'New code sent.' } }),
  };
  const cache = new Map();
  const mockReact = { ...React, useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  } };
  const components = Object.fromEntries(['EmailOtpModal', 'PasswordToggle', 'ApiStatusModal'].map(name => [name, function Placeholder() {}]));
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename);
    cache.set(filename, mod);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));
    const original = mod.require.bind(mod);
    mod.require = (id) => {
      if (id === 'react') return mockReact;
      if (id === 'next/link' || id === 'next/image') return { __esModule: true, default: () => null };
      if (id === 'next/router') return { useRouter: () => ({ query: { next: '/shop/cart' }, push: async route => routes.push(route) }) };
      const component = components[id.split('/').pop()];
      if (component) return { __esModule: true, default: component };
      if (id === '@/util/MainApi') return { __esModule: true, default: { post: async (url, body) => { calls.push({ url, body }); return handlers[url](body); } } };
      if (id === '@/util/authSession') return { extractAuthPayload: data => data.data, setAuthTokens: value => tokens.push(value), setAuthUser: value => users.push(value) };
      if (id.startsWith('@/')) return load(`src/${id.slice(2)}${path.extname(id) ? '' : '.js'}`);
      if (id.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), id)));
      return original(id);
    };
    mod._compile(swc.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
    }).code, filename);
    return mod.exports;
  }
  const Login = load('src/components/auth/user/Login.jsx').default;
  function render() {
    cursor = 0;
    const nodes = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(Login());
    return {
      otp: nodes.find(node => node.type === components.EmailOtpModal)?.props,
      feedback: nodes.find(node => node.type === components.ApiStatusModal).props,
      field: name => nodes.find(node => node.type === 'input' && node.props.name === name).props,
      submit: () => nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }),
    };
  }
  async function signIn() {
    render().field('email').onChange({ target: { name: 'email', value: '  Pending@Example.com  ' } });
    render().field('password').onChange({ target: { name: 'password', value: ' Password123! ' } });
    await render().submit();
    return render();
  }
  async function openVerification() {
    await signIn();
    render().feedback.onOk();
    return render();
  }
  return { render, signIn, openVerification, calls, routes, tokens, users, handlers };
}

test('unverified login shows failure feedback first, then opens OTP on Verify Email', async () => {
  const h = harness();
  const feedbackView = await h.signIn();
  assert.equal(feedbackView.otp, undefined);
  assert.equal(feedbackView.feedback.status, 'error');
  assert.equal(feedbackView.feedback.title, 'Login Failed');
  assert.equal(feedbackView.feedback.text, 'Your email is not verified. Please verify your email.');
  assert.equal(feedbackView.feedback.okLabel, 'Verify Email');
  feedbackView.feedback.onOk();
  const view = h.render();
  assert.equal(view.otp.isOpen, true);
  assert.equal(view.otp.email, 'pending@example.com');
  assert.equal(view.otp.message, unverifiedMessage);
  assert.equal(view.feedback.status, undefined);
  assert.deepEqual(h.calls, [{ url: '/auth/login', body: { email: 'pending@example.com', password: ' Password123! ' } }]);
  assert.equal(h.tokens.length, 0);
  assert.equal(h.routes.length, 0);
});

test('successful verification retries login and preserves the shop return destination', async () => {
  const h = harness();
  const view = await h.openVerification();
  h.handlers['/auth/login'] = async () => ({ data: { data: { accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', user: { role: 'CLIENT' } } } });
  await view.otp.onVerify('123456');
  assert.deepEqual(h.calls.map(call => call.url), ['/auth/login', '/auth/verify-email', '/auth/login']);
  assert.deepEqual(h.calls[1].body, { email: 'pending@example.com', otp: '123456' });
  assert.deepEqual(h.calls[2].body, h.calls[0].body);
  assert.equal(h.render().otp, undefined);
  assert.equal(h.tokens[0].accessToken, 'synthetic-access');
  assert.deepEqual(h.users, [{ role: 'CLIENT' }]);
  assert.deepEqual(h.routes, ['/shop/cart']);
});

test('invalid and expired codes keep OTP open and never establish a session', async () => {
  const h = harness();
  await h.openVerification();
  await h.render().otp.onVerify('12');
  assert.match(h.render().otp.error, /6 digit OTP/);
  assert.equal(h.calls.length, 1);
  h.handlers['/auth/verify-email'] = async () => { throw apiError('OTP has expired.'); };
  await h.render().otp.onVerify('123456');
  assert.equal(h.render().otp.error, 'OTP has expired.');
  assert.equal(h.render().otp.isVerifying, false);
  assert.equal(h.render().feedback.status, undefined);
  assert.equal(h.tokens.length, 0);
  assert.equal(h.routes.length, 0);
});

test('resend reports success and failure inside OTP and permits a clean reopen', async () => {
  const h = harness();
  await h.openVerification();
  assert.equal(await h.render().otp.onResend(), true);
  assert.equal(h.render().otp.message, 'New code sent.');
  assert.deepEqual(h.calls.at(-1), { url: '/auth/resend-otp', body: { email: 'pending@example.com' } });
  h.handlers['/auth/resend-otp'] = async () => { throw apiError('Please try again later.'); };
  assert.equal(await h.render().otp.onResend(), false);
  assert.equal(h.render().otp.error, 'Please try again later.');
  assert.equal(h.render().otp.isResending, false);
  h.render().otp.onClose();
  assert.equal(h.render().otp, undefined);
  await h.render().submit();
  assert.equal(h.render().otp, undefined);
  h.render().feedback.onOk();
  assert.equal(h.render().otp.error, '');
  assert.equal(h.render().otp.message, unverifiedMessage);
});

test('ordinary credential errors retain Login Failed feedback', async () => {
  const h = harness();
  h.handlers['/auth/login'] = async () => { throw apiError('Invalid email or password.'); };
  const view = await h.signIn();
  assert.equal(view.otp, undefined);
  assert.equal(view.feedback.title, 'Login Failed');
  assert.equal(view.feedback.text, 'Invalid email or password.');
});

test('failure to sign in after verification remains a login error', async () => {
  const h = harness();
  await h.openVerification();
  h.handlers['/auth/login'] = async () => { throw apiError('Please try signing in again.'); };
  await h.render().otp.onVerify('123456');
  assert.equal(h.render().otp, undefined);
  assert.equal(h.render().feedback.title, 'Login Failed');
  assert.equal(h.tokens.length, 0);
});
