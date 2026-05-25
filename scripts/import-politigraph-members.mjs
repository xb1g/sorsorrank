#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const POLITIGRAPH_URL = "https://politigraph.wevis.info/graphql";
const DEFAULT_ASSEMBLY_ID = "สภาผู้แทนราษฎร-27";
const DEFAULT_ROLE = "สมาชิกสภาผู้แทนราษฎร";
const DEFAULT_ROSTER_VERSION = 27;
const DEFAULT_VOTE_LIMIT = 5;
const SOURCE_URL = "https://politigraph.wevis.info/";
const PARLIAMENTWATCH_BASE =
  "https://parliamentwatch.wevis.info/assemblies/%E0%B8%AA%E0%B8%A0%E0%B8%B2%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B9%81%E0%B8%97%E0%B8%99%E0%B8%A3%E0%B8%B2%E0%B8%A9%E0%B8%8E%E0%B8%A3-27/members/party";
const MEMBERSHIPS_QUERY = `query HouseMemberships($assemblyId: ID!, $role: String!, $limit: Int!, $offset: Int!, $voteLimit: Int!) {
  memberships(
    where: { posts: { some: { organizations: { some: { id: { eq: $assemblyId } } }, role: { eq: $role } } } }
    limit: $limit
    offset: $offset
    sort: [{ start_date: ASC }]
  ) {
    id
    label
    province
    district_number
    list_number
    start_date
    end_date
    members(where: { Person: { publish_status: { eq: PUBLISHED } } }) {
      __typename
      ... on Person {
        id
        prefix
        name
        image
        votes(limit: $voteLimit) {
          option
          vote_events(limit: 1) {
            id
            title
            start_date
            links(limit: 1) {
              url
            }
          }
        }
        partyMemberships: memberships(
          where: { posts: { some: { organizations: { some: { classification: { eq: POLITICAL_PARTY } } } } }, end_date: { eq: null } }
          limit: 1
        ) {
          posts {
            organizations(where: { classification: { eq: POLITICAL_PARTY } }) {
              name
            }
          }
        }
      }
    }
  }
}`;

const args = parseArgs(process.argv.slice(2));
const env = await readDotEnv(args.env ?? ".env.supabase.local");
const projectRef = requireEnv(env, "SUPABASE_PROJECT_REF");
const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
const supabaseUrl = (env.SUPABASE_URL || `https://${projectRef}.supabase.co`).replace(/\/$/, "");
const assemblyId = args.assembly ?? DEFAULT_ASSEMBLY_ID;
const role = args.role ?? DEFAULT_ROLE;
const rosterVersion = Number(args.rosterVersion ?? DEFAULT_ROSTER_VERSION);
const dryRun = Boolean(args.dryRun);
const keepExistingActive = Boolean(args.keepExistingActive);
const pageSize = Math.min(Number(args.pageSize ?? 100), 100);
const voteLimit = Math.min(Math.max(Number(args.voteLimit ?? DEFAULT_VOTE_LIMIT), 0), 10);

const memberships = await fetchAllMemberships({ assemblyId, role, pageSize, voteLimit });
const records = memberships.map((membership) => mapMembershipToPolitician(membership, rosterVersion));
const voteRecordsByMembershipId = new Map(
  memberships.map((membership) => [membership.id, mapMembershipToVoteRecords(membership, voteLimit)])
);
const voteRecordCount = Array.from(voteRecordsByMembershipId.values()).reduce((total, records) => total + records.length, 0);

console.log(
  `Prepared ${records.length} Politigraph roster rows: ${
    records.filter((record) => record.status === "active").length
  } active, ${records.filter((record) => record.status === "archived").length} archived.`
);
console.log(`Prepared ${voteRecordCount} factual vote records for expanded cards.`);

if (dryRun) {
  console.log(JSON.stringify({
    politicians: records.slice(0, 5),
    voteRecords: Array.from(voteRecordsByMembershipId.entries()).slice(0, 5)
  }, null, 2));
  process.exit(0);
}

await upsertPoliticians(records);
await upsertVoteRecords(voteRecordsByMembershipId);
if (!keepExistingActive) {
  await archiveLegacyRosterRows(rosterVersion);
}
await writeAuditLog(records.length, rosterVersion, assemblyId);
console.log("Imported Politigraph roster into Supabase.");

async function fetchAllMemberships({ assemblyId, role, pageSize, voteLimit }) {
  const all = [];
  for (let offset = 0; ; offset += pageSize) {
    const data = await politigraphQuery(MEMBERSHIPS_QUERY, {
      assemblyId,
      role,
      limit: pageSize,
      offset,
      voteLimit
    });
    const page = data.memberships ?? [];
    all.push(...page);
    console.log(`Fetched Politigraph memberships ${offset + 1}-${offset + page.length}.`);

    if (page.length < pageSize) {
      break;
    }

    await sleep(400);
  }

  const uniqueById = new Map();
  for (const membership of all) {
    uniqueById.set(membership.id, membership);
  }
  if (uniqueById.size !== all.length) {
    console.log(`Deduplicated ${all.length - uniqueById.size} repeated Politigraph memberships.`);
  }

  return Array.from(uniqueById.values());
}

async function politigraphQuery(query, variables) {
  const response = await fetch(POLITIGRAPH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Politigraph request failed: ${response.status} ${response.statusText} ${await response.text()}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Politigraph GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

function mapMembershipToPolitician(membership, rosterVersion) {
  const person = membership.members?.find((member) => member.__typename === "Person");
  if (!person?.id || !person?.name) {
    throw new Error(`Membership ${membership.id} does not have a person member.`);
  }

  const displayName = normalizeText([person.prefix, person.name].filter(Boolean).join(" "));
  const party = normalizeText(
    person.partyMemberships?.[0]?.posts?.[0]?.organizations?.[0]?.name ?? ""
  );
  const roleLabel = buildRoleLabel(membership);
  const searchQuery = normalizeText([displayName, DEFAULT_ROLE, party, membership.province].filter(Boolean).join(" "));
  const imageUrl = normalizeUrl(person.image);

  return {
    slug: `pg-${membership.id}`,
    display_name: displayName,
    role_label: roleLabel,
    party_label: party,
    status: membership.end_date ? "archived" : "active",
    search_query: searchQuery.slice(0, 240),
    active_candidate: false,
    legal_reviewed_at: null,
    roster_version: rosterVersion,
    image_url: imageUrl,
    image_source_url: imageUrl ? SOURCE_URL : null,
    info_source_url: PARLIAMENTWATCH_BASE,
    politigraph_person_id: person.id,
    politigraph_membership_id: membership.id
  };
}

function mapMembershipToVoteRecords(membership, voteLimit) {
  if (voteLimit <= 0) {
    return [];
  }

  const person = membership.members?.find((member) => member.__typename === "Person");
  return (person?.votes ?? [])
    .map((vote) => {
      const event = vote.vote_events?.[0];
      const title = normalizeText(event?.title);
      const option = normalizeText(vote.option);
      if (!event?.id || !title || !option) {
        return null;
      }

      return {
        vote_event_id: String(event.id),
        title: title.slice(0, 500),
        start_date: event.start_date || null,
        option: option.slice(0, 80),
        source_url: safeSourceUrl(event.links?.[0]?.url)
      };
    })
    .filter(Boolean)
    .sort((left, right) => String(right.start_date ?? "").localeCompare(String(left.start_date ?? "")))
    .slice(0, voteLimit);
}

function buildRoleLabel(membership) {
  const parts = [DEFAULT_ROLE, membership.label, membership.province]
    .filter(Boolean)
    .map((part) => String(part).trim());
  if (membership.district_number) {
    parts.push(`#${membership.district_number}`);
  }
  if (membership.list_number) {
    parts.push(`list #${membership.list_number}`);
  }
  return normalizeText(parts.join(" - ")).slice(0, 120);
}

async function upsertPoliticians(records) {
  const url = `${supabaseUrl}/rest/v1/politicians?on_conflict=politigraph_membership_id`;
  for (let offset = 0; offset < records.length; offset += 100) {
    const batch = records.slice(offset, offset + 100);
    await supabaseRequest("POST", url, batch);
    console.log(`Upserted rows ${offset + 1}-${offset + batch.length}.`);
  }
}

async function upsertVoteRecords(recordsByMembershipId) {
  const membershipIds = Array.from(recordsByMembershipId.keys());
  if (membershipIds.length === 0) {
    return;
  }

  const politicianRows = [];
  for (let offset = 0; offset < membershipIds.length; offset += 100) {
    const batchIds = membershipIds.slice(offset, offset + 100);
    const filter = encodeURIComponent(`(${batchIds.join(",")})`);
    const url = `${supabaseUrl}/rest/v1/politicians?select=id,politigraph_membership_id&politigraph_membership_id=in.${filter}`;
    const rows = await supabaseRequest("GET", url);
    politicianRows.push(...(rows ?? []));
  }

  const politicianIdByMembershipId = new Map(
    politicianRows.map((row) => [row.politigraph_membership_id, row.id])
  );
  const rows = [];
  for (const [membershipId, records] of recordsByMembershipId.entries()) {
    const politicianId = politicianIdByMembershipId.get(membershipId);
    if (!politicianId) {
      continue;
    }

    for (const record of records) {
      rows.push({
        politician_id: politicianId,
        ...record
      });
    }
  }

  const url = `${supabaseUrl}/rest/v1/politician_vote_records?on_conflict=politician_id,vote_event_id`;
  for (let offset = 0; offset < rows.length; offset += 100) {
    const batch = rows.slice(offset, offset + 100);
    await supabaseRequest("POST", url, batch);
    console.log(`Upserted vote records ${offset + 1}-${offset + batch.length}.`);
  }
}

async function archiveLegacyRosterRows(rosterVersion) {
  const url = `${supabaseUrl}/rest/v1/politicians?roster_version=eq.${rosterVersion}&politigraph_membership_id=is.null&status=eq.active`;
  await supabaseRequest("PATCH", url, {
    status: "archived"
  });
  console.log(`Archived legacy active roster_version=${rosterVersion} rows without Politigraph IDs.`);
}

async function writeAuditLog(totalRows, rosterVersion, assemblyId) {
  await supabaseRequest("POST", `${supabaseUrl}/rest/v1/admin_audit_logs`, [
    {
      admin_id: "politigraph-import",
      action: "roster_politigraph_import",
      target_type: "politicians",
      target_id: null,
      metadata: {
        assembly_id: assemblyId,
        total_rows: totalRows,
        roster_version: rosterVersion,
        source: POLITIGRAPH_URL,
        archived_legacy_rows: !keepExistingActive
      }
    }
  ]);
}

async function supabaseRequest(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json; charset=utf-8",
      prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText} ${await response.text()}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg.startsWith("--")) {
      parsed[arg.slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function readDotEnv(path) {
  const text = await readFile(path, "utf8");
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsAt = trimmed.indexOf("=");
    if (equalsAt < 1) continue;
    const key = trimmed.slice(0, equalsAt).trim();
    let value = trimmed.slice(equalsAt + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value || value.startsWith("YOUR_")) {
    throw new Error(`Missing ${key} in env file.`);
  }
  return value;
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(value) {
  const text = normalizeText(value);
  if (!text) return null;
  if (!text.startsWith("https://") || /[<>]/.test(text)) {
    throw new Error(`Unsafe URL from Politigraph: ${text}`);
  }
  return text;
}

function safeSourceUrl(value) {
  const text = normalizeText(value);
  if (!text || !text.startsWith("https://") || /[<>]/.test(text)) {
    return SOURCE_URL;
  }
  return text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
