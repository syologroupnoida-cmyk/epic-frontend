import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { agentPanelFromSlug, agentPanelPath, agentPanelSlugs } from "../src/util/agentDashboardRoutes.mjs";

test("each vendor panel resolves to a dedicated route with no query string", () => {
  for (const [panel, slug] of Object.entries(agentPanelSlugs)) {
    assert.equal(agentPanelFromSlug(slug), panel);
    assert.equal(agentPanelPath(panel), panel === "Overview" ? "/partner/dashboard" : `/partner/${slug}`);
    assert.ok(!agentPanelPath(panel).includes("?"));
  }
});

test("unknown and unsafe panel values never create external redirects", () => {
  assert.equal(agentPanelFromSlug("https://example.com"), null);
  assert.equal(agentPanelFromSlug(["update-profile"]), null);
  assert.equal(agentPanelPath("//example.com"), "/partner/dashboard");
  assert.equal(agentPanelPath("toString"), "/partner/dashboard");
});

test("every dashboard destination has an individual page file", () => {
  for (const panel of Object.keys(agentPanelSlugs)) {
    const path = agentPanelPath(panel);
    assert.ok(existsSync(new URL(`../src/pages${path}.js`, import.meta.url)), `Missing page for ${path}`);
  }
  assert.equal(existsSync(new URL("../src/pages/partner/[panel].js", import.meta.url)), false);
});

test("service management uses add-services.js and supports existing links", () => {
  assert.equal(agentPanelPath("Manage Services"), "/partner/add-services");
  assert.equal(agentPanelFromSlug("add-services"), "Manage Services");
  assert.equal(agentPanelFromSlug("manage-services"), "Manage Services");
});
