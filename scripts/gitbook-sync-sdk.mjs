#!/usr/bin/env node

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const {
  GITBOOK_API_TOKEN,
  GITBOOK_ORG_ID,
  PARENT_SPACE_ID,
  GITBOOK_SITE_ID,
  GIT_REF,
  SPACE_VISIBILITY = "public",
  SPACE_ICON_URL = "https://firebasestorage.googleapis.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FULrmzCkJk7WEl6FnhbTZ%2Ficon%2FvYf8cnyycn97DBMRLNJr%2Fhp-sdk-docs-logo.png?alt=media",
  REPO_URL = "https://github.com/humanprotocol/human-protocol",
  GITBOOK_API_BASE = "https://api.gitbook.com/v1",
  MAKE_DEFAULT = "false",
} = process.env;

if (!GITBOOK_API_TOKEN) fail("Missing GITBOOK_API_TOKEN");
if (!GITBOOK_ORG_ID) fail("Missing GITBOOK_ORG_ID");
if (!GIT_REF) fail("Missing GIT_REF");

const tag = GIT_REF.replace(/^refs\/tags\//, "");
if (!/^sdk@/.test(tag)) fail(`Tag must start with sdk@: ${tag}`);
const version = tag.split("@")[1];
if (!version) fail("Cannot derive version from tag");

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json, text/plain, */*",
  Authorization: `Bearer ${GITBOOK_API_TOKEN}`,
};
const api = async (path, init = {}) => {
  const res = await fetch(`${GITBOOK_API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return { status: res.status };
  if (!text) return { status: res.status };
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return { status: res.status, body: text };
    }
  }
  return { status: res.status, body: text };
};

async function createSpace() {
  const body = { title: `v${version}`, visibility: SPACE_VISIBILITY };
  if (PARENT_SPACE_ID) body.parent = PARENT_SPACE_ID;
  return api(`/orgs/${GITBOOK_ORG_ID}/spaces`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function importDocs(spaceId) {
  return api(`/spaces/${spaceId}/git/import`, {
    method: "POST",
    body: JSON.stringify({
      url: REPO_URL,
      ref: `refs/tags/${tag}`,
    }),
  });
}

async function setSpaceIconFromUrl(spaceId, iconUrl) {
  return api(`/spaces/${spaceId}`, {
    method: "PATCH",
    body: JSON.stringify({ icon: iconUrl }),
  });
}

async function createSiteSpace(siteId, spaceId) {
  return api(`/orgs/${GITBOOK_ORG_ID}/sites/${siteId}/site-spaces`, {
    method: "POST",
    body: JSON.stringify({ spaceId }),
  });
}

async function setSectionDefaultSiteSpace(siteId, siteSpaceId) {
  return api(`/orgs/${GITBOOK_ORG_ID}/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify({ defaultSiteSpace: siteSpaceId }),
  });
}

(async () => {
  try {
    const space = await createSpace();
    console.log(`Importing docs for version ${version} into space ${space.id}`);
    const imp = await importDocs(space.id);

    await setSpaceIconFromUrl(space.id, SPACE_ICON_URL);

    if (GITBOOK_SITE_ID) {
      const siteSpace = await createSiteSpace(GITBOOK_SITE_ID, space.id);
      if (MAKE_DEFAULT === "true") {
        await setSectionDefaultSiteSpace(GITBOOK_SITE_ID, siteSpace.id);
      }
    }
  } catch (e) {
    console.error(e.stack || e.message);
    process.exit(1);
  }
})();
