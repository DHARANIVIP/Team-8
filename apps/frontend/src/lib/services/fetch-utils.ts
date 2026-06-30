export async function parseJsonOrText(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function parseResponse(response: Response) {
  const body = await parseJsonOrText(response);

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.error || body?.message || response.statusText;
    throw new Error(message || 'Request failed');
  }

  return body;
}
