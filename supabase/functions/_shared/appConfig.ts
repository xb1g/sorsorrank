type SupabaseLike = {
  from: (table: string) => any;
};

export async function readAppConfig(supabase: SupabaseLike) {
  const { data, error } = await supabase.from("app_config").select("key,value");

  if (error) {
    throw error;
  }

  const values = new Map<string, unknown>();
  for (const row of data ?? []) {
    values.set(row.key, row.value);
  }

  return {
    boolean(key: string, fallback: boolean) {
      const value = values.get(key);
      return typeof value === "boolean" ? value : fallback;
    },
    integer(key: string, fallback: number) {
      const value = values.get(key);
      return typeof value === "number" && Number.isInteger(value) ? value : fallback;
    },
    string(key: string, fallback: string) {
      const value = values.get(key);
      return typeof value === "string" ? value : fallback;
    }
  };
}
