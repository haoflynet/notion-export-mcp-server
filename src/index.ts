#!/usr/bin/env node

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GetExportResultRequestSchema } from './schemas.js';
import { NotionExporter, defaultConfig } from './exporter.js';

const tokenV2 = process.env.NOTION_TOKEN_V2;
if (!tokenV2) {
  throw new Error('NOTION_TOKEN_V2 environment variable is required');
}

const fileToken = process.env.NOTION_FILE_TOKEN;
if (!fileToken) {
  throw new Error('NOTION_FILE_TOKEN environment variable is required');
}

const SAFE_ERROR_PATTERNS = [
  /^Params are required$/,
  /^Unknown tool:/,
  /^Notion page id/,
  /^Invalid download URL/,
  /^Download URL must use HTTPS/,
  /^Download URL host not allowed/,
  /^Zip entry path traversal/,
  /^Export task failed:/,
  /^Could not find file in ZIP/,
];

const sanitizeErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred';
  }
  const message = error.message;
  for (const pattern of SAFE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return message;
    }
  }
  return 'An error occurred while processing the request';
};

const server = new Server(
  {
    name: 'notion-export-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'notion_export_get_result',
        description: 'Get notion export result',
        inputSchema: zodToJsonSchema(GetExportResultRequestSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params) {
      throw new Error('Params are required');
    }

    switch (request.params.name) {
      case 'notion_export_get_result': {
        const args = GetExportResultRequestSchema.parse(
          request.params.arguments
        );

        const exporter = new NotionExporter(tokenV2, fileToken, {
          ...defaultConfig,
          recursive: args.recursive,
        });

        const mdTexts = await exporter.getAllMdString(args.id);

        return {
          content: mdTexts.map((r) => ({ type: 'text', text: r })),
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    throw new Error(sanitizeErrorMessage(error));
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Notion Export MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
