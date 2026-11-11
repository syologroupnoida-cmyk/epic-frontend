const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const swc = require('next/dist/build/swc');

test('vendor loading markup stays identical before and after router readiness', async () => {
  await swc.loadBindings();
  const filename = path.resolve(__dirname, '../src/components/vendor/useMarketplaceVendors.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' },
    module: { type: 'commonjs' },
  });
  const hookModule = new Module(filename, module);
  // Effects do not run during SSR, so no network dependencies are needed.
  hookModule.require = (id) => id === 'react' ? React : {};
  hookModule._compile(code, filename);
  const useMarketplaceVendors = hookModule.exports.default;
  function InitialView({ ready, slug }) {
    const result = useMarketplaceVendors({ slug: 'wedding-vendors' }, { enabled: ready, slug });
    return React.createElement('span', null, result.loading ? 'Loading businesses' : 'Empty directory');
  }
  for (const slug of [undefined, 'example-business']) {
    const server = renderToStaticMarkup(React.createElement(InitialView, { ready: false, slug }));
    const firstClient = renderToStaticMarkup(React.createElement(InitialView, { ready: true, slug }));
    assert.equal(server, firstClient);
    assert.equal(server, '<span>Loading businesses</span>');
  }
});
