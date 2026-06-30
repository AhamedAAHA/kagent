const MCP_URL = process.env.KAPRUKA_MCP_URL ?? 'https://mcp.kapruka.com/mcp';

interface McpToolResult {
  content?: { type: string; text: string }[];
  isError?: boolean;
}

function parseSsePayload(text: string): McpToolResult {
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const data = JSON.parse(line.slice(6)) as {
      result?: McpToolResult;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    if (data.result) return data.result;
  }
  throw new Error('No MCP response in SSE stream');
}

async function openMcpSession(): Promise<string> {
  const initRes = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'kagent', version: '1.0.0' },
      },
    }),
  });

  const sessionId = initRes.headers.get('mcp-session-id');
  if (!sessionId) throw new Error('Kapruka MCP did not return a session id');

  await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }),
  });

  return sessionId;
}

/** Call a Kapruka MCP tool. Arguments are nested under `params` per Kapruka protocol. */
export async function callKaprukaTool<T = unknown>(
  name: string,
  params: Record<string, unknown>,
): Promise<T> {
  const sessionId = await openMcpSession();

  const toolRes = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name, arguments: { params } },
    }),
  });

  const text = await toolRes.text();
  const result = parseSsePayload(text);
  const content = result.content?.[0]?.text ?? '';

  if (result.isError || content.startsWith('Error')) {
    throw new Error(content || `Kapruka tool ${name} failed`);
  }

  if (content.startsWith('No products found') || content.startsWith('No delivery cities')) {
    return { results: [], cities: [], total_matched: 0, showing: 0 } as T;
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    return content as T;
  }
}
