# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Model Context Protocol (MCP) server that provides access to Notion's unofficial export API. It allows AI assistants to export Notion pages as Markdown through a standardized MCP interface.

**Important:** This relies on Notion's internal/unofficial API using browser cookies (`token_v2`, `file_token`) for authentication. The API may break without notice.

## Common Commands

```bash
npm run dev          # Development mode with ts-node
npm run build        # Build to dist/ (tsc + chmod)
npm run start        # Run production build
npm run lint         # Check ESLint + Prettier
npm run fix          # Auto-fix lint issues
npm run examples     # Run example export script
npm run examples:write  # Run example and write files to ./out
```

## Architecture

```
src/
├── index.ts      # MCP server entry point, tool registration, request handling
├── exporter.ts   # NotionExporter class - handles Notion API communication and ZIP extraction
└── schemas.ts    # Zod schemas for input validation
```

**Flow:** MCP request → `index.ts` validates input via Zod schema → `NotionExporter` enqueues export task → polls for completion → downloads ZIP → extracts Markdown files

**Key class:** `NotionExporter` in `exporter.ts` manages the full export lifecycle:
- `getTaskId()` - Enqueue export task with Notion API
- `pollTask()` - Wait for export completion
- `downloadZip()` - Fetch exported ZIP from URL
- `getAllMdString()` / `getMdFiles()` - Extract content from ZIP

## Code Style Rules

- Do not use Chinese characters in code or comments. All code and comments must be in English.

## Environment Variables

Required:
- `NOTION_TOKEN_V2` - Notion `token_v2` cookie value
- `NOTION_FILE_TOKEN` - Notion `file_token` cookie value

Optional:
- `NOTION_REQUEST_TIMEOUT` - Request timeout in milliseconds (default: 60000)

For examples script:
- `WRITE_TO_FILE` - Set to "true" to write exported files to disk
- `OUTPUT_BASE_PATH` - Directory for exported files (default: current directory)
