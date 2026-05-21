export async function consumeRateLimit(
  supabase: { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> },
  keyHash: string,
  bucket: string,
  limit: number,
  windowSeconds: number
) {
  const { error } = await supabase.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds
  });

  if (error) {
    throw error;
  }
}
