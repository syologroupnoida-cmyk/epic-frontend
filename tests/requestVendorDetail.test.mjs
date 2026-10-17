import test from "node:test";
import assert from "node:assert/strict";
import { requestVendorDetail } from "../src/util/requestVendorDetail.mjs";

test("published vendors use the public detail endpoint", async () => {
  const calls = [];
  const response = { data: { data: { slug: "transport" } } };
  const result = await requestVendorDetail(async (path) => { calls.push(path); return response; }, "transport", { allowOwnProfile: true });
  assert.equal(result, response);
  assert.deepEqual(calls, ["/marketplace/vendors/transport"]);
});

test("owner can open their matching draft profile when public detail returns 404", async () => {
  const calls = [];
  const own = { data: { data: { slug: "transport-vend-566732", profileStatus: "DRAFT" } } };
  const result = await requestVendorDetail(async (path) => {
    calls.push(path);
    if (calls.length === 1) throw { response: { status: 404 } };
    return own;
  }, "transport-vend-566732", { allowOwnProfile: true });
  assert.equal(result, own);
  assert.deepEqual(calls, ["/marketplace/vendors/transport-vend-566732", "/vendor/profile"]);
});

test("guests do not fetch the private vendor profile", async () => {
  let calls = 0;
  const error = { response: { status: 404 } };
  await assert.rejects(requestVendorDetail(async () => { calls++; throw error; }, "transport"), (result) => result === error);
  assert.equal(calls, 1);
});

test("a different owner's profile cannot replace the requested vendor", async () => {
  let calls = 0;
  const error = { response: { status: 404 } };
  await assert.rejects(requestVendorDetail(async () => {
    if (++calls === 1) throw error;
    return { data: { data: { slug: "another-vendor" } } };
  }, "transport", { allowOwnProfile: true }), (result) => result === error);
});

test("server errors do not silently substitute a private profile", async () => {
  let calls = 0;
  const error = { response: { status: 500 } };
  await assert.rejects(requestVendorDetail(async () => { calls++; throw error; }, "transport", { allowOwnProfile: true }), (result) => result === error);
  assert.equal(calls, 1);
});
