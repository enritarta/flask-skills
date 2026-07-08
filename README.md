# Flask plugin for Claude Code

[Flask](https://flask.do) is the feedback layer for video, built for the agentic
loop: your agent uploads a render and shares the link instantly. The reviewer
doesn't type - they hit record and talk through the video (voice, camera, screen,
drawing on frames), and Flask turns the recording into structured, timestamped
comments with transcripts. The agent reads that feedback and iterates, pushing
each revision as a new version of the same asset. Typed comments work too -
recordings are the advantage, not a requirement.

This plugin connects the [Flask MCP server](https://flask.do/mcp) and teaches the
agent the full review loop.

## Install

One command connects the Flask MCP server (Claude Code, Cursor) and installs
the review-loop skill for any agent that reads skills:

```
npx flask-feedback
```

Prefer to wire things yourself? Per-client instructions below.

### Claude Code

```
/plugin marketplace add tryflask/skills
/plugin install flask@flask
```

Then authenticate once: `/mcp` -> `flask` -> complete the browser sign-in.

No plugin manager? Connect the MCP server directly:

```
claude mcp add --transport http flask https://api.flask.do/api/mcp/mcp
```

### Cursor, Codex, and other agents

Install the review-loop skill (works across skills-compatible clients):

```
npx skills add tryflask/skills
```

Then connect the MCP server:

- **Cursor**: [![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=flask&config=eyJ1cmwiOiJodHRwczovL2FwaS5mbGFzay5kby9hcGkvbWNwL21jcCJ9)
- **claude.ai / Claude Desktop**: Settings -> Connectors -> add `https://api.flask.do/api/mcp/mcp`
- **Any MCP client**: Streamable HTTP at `https://api.flask.do/api/mcp/mcp` (OAuth sign-in opens in the browser on first use)

## What the agent can do

| Tool | What it does |
|---|---|
| `contents`, `search`, `recent_activity` | Browse folders/assets, search, latest team feedback |
| `feedback_list`, `feedback_get` | Read feedback with tags, timestamps, recording transcripts (`transcript: "full"` for whole recording) |
| `wait_for_feedback` | Long-poll - returns new feedback the moment it's left |
| `get_annotated_frames` | Returns the video frames a recording pointed at / drew on, as images with the drawing rendered in, plus the transcript marked `[FRAME N]` - resolves "this"/"here"/drawn-circle references to actual pixels |
| `upload_file_start` / `upload_file_complete` | Upload a local video (5GB max) via presigned URL; share link available the instant the upload starts |
| `upload_video` | Import from a public URL or Google Drive link |
| `version_of` (param on uploads) | Upload as a new version of an existing asset - one stable link for the whole iteration |
| `asset_status`, `tags`, `permission_get` | Processing status, tag distribution, folder access |

The server is read-only except for uploads - it can never edit or delete anything.

## The loop in practice

```
agent renders video -> upload_file_start -> user gets flask.do link instantly
user records feedback on the video -> wait_for_feedback returns it (transcribed)
agent implements changes -> uploads v2 with version_of -> same link shows v2
```

## Docs and support

- Server documentation: https://flask.do/mcp
- Support: hello@flask.do

This repo is kept in sync with the MCP server. Tool list and behavior described
here mirror https://flask.do/mcp, which is the source of truth.
