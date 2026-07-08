#!/usr/bin/env node
/**
 * npx flask-feedback — one-shot setup for Flask (flask.do), the video
 * feedback MCP server for AI agents.
 *
 * Wires the Flask MCP server into the coding agents on this machine and
 * installs the flask-review agent skill (the upload -> review -> iterate
 * playbook). Safe to re-run; every step is idempotent.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const SERVER_NAME = "flask";
const SERVER_URL = "https://api.flask.do/api/mcp/mcp";
const SKILLS_REPO = "enritarta/flask-skills";
const DOCS_URL = "https://flask.do/mcp";

const ok = (msg) => console.log(`  ✓ ${msg}`);
const skip = (msg) => console.log(`  – ${msg}`);
const fail = (msg) => console.log(`  ✗ ${msg}`);

function hasCommand(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  return spawnSync(probe, [cmd], { stdio: "ignore" }).status === 0;
}

function connectClaudeCode() {
  if (!hasCommand("claude")) {
    skip("Claude Code not found (install: https://claude.com/claude-code)");
    return;
  }
  const res = spawnSync(
    "claude",
    ["mcp", "add", "--transport", "http", "-s", "user", SERVER_NAME, SERVER_URL],
    { encoding: "utf8" }
  );
  if (res.status === 0) {
    ok("Claude Code: Flask MCP server connected (user scope)");
  } else if (`${res.stderr}${res.stdout}`.includes("already exists")) {
    ok("Claude Code: Flask MCP server already connected");
  } else {
    fail(`Claude Code: could not add server automatically. Run:\n      claude mcp add --transport http -s user ${SERVER_NAME} ${SERVER_URL}`);
  }
}

function connectCursor() {
  const cursorDir = join(homedir(), ".cursor");
  if (!existsSync(cursorDir)) {
    skip("Cursor not found");
    return;
  }
  const configPath = join(cursorDir, "mcp.json");
  let config = {};
  try {
    if (existsSync(configPath)) config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    fail(`Cursor: ${configPath} is not valid JSON; add the server manually (${DOCS_URL})`);
    return;
  }
  config.mcpServers = config.mcpServers || {};
  if (config.mcpServers[SERVER_NAME]?.url === SERVER_URL) {
    ok("Cursor: Flask MCP server already connected");
    return;
  }
  config.mcpServers[SERVER_NAME] = { url: SERVER_URL };
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  ok("Cursor: Flask MCP server added to ~/.cursor/mcp.json");
}

function installSkill() {
  console.log("\nInstalling the flask-review agent skill (via the skills CLI)...\n");
  const res = spawnSync("npx", ["-y", "skills", "add", SKILLS_REPO, "-y"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    fail(`Skill install did not complete. Run manually: npx skills add ${SKILLS_REPO}`);
  }
}

console.log("\nFlask — video feedback for AI agents (flask.do)\n");
console.log("Connecting the Flask MCP server:\n");
connectClaudeCode();
connectCursor();
console.log(`\n  Other MCP clients: add ${SERVER_URL} (Streamable HTTP). Docs: ${DOCS_URL}`);
installSkill();
console.log(`
Done. First time an agent calls Flask, a browser window opens for a
one-time sign-in. Then try: "upload my render to Flask and wait for feedback".

  Server   ${SERVER_URL}
  Docs     ${DOCS_URL}
`);
