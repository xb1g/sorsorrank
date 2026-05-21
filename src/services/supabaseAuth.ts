import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseAuthSnapshot {
  isConfigured: boolean;
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  isAnonymous?: boolean;
}

export interface SupabaseAccountResult {
  status: "signed-in" | "confirmation-sent";
  email: string;
  message: string;
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const supabaseUrl = readConfigValue(env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
const supabasePublishableKey = readConfigValue(
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY
);

let supabaseClient: SupabaseClient | null | undefined;

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabasePublishableKey() {
  return supabasePublishableKey ?? "";
}

export async function getSupabaseAuthSnapshot(): Promise<SupabaseAuthSnapshot> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      isConfigured: false,
      isAuthenticated: false
    };
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  return {
    isConfigured: true,
    isAuthenticated: Boolean(data.session),
    userId: data.session?.user.id,
    email: data.session?.user.email,
    isAnonymous: data.session?.user.is_anonymous
  };
}

export async function getSupabaseAccessToken() {
  const client = getSupabaseClient();
  if (!client) {
    return "";
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  return data.session?.access_token ?? "";
}

export async function ensureSupabaseAnonymousSession(captchaToken?: string): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data: existing, error: existingError } = await client.auth.getSession();
  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing.session) {
    return existing.session;
  }

  const { data, error } = await client.auth.signInAnonymously(
    captchaToken
      ? {
          options: {
            captchaToken
          }
        }
      : undefined
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Supabase Auth did not return a session.");
  }

  return data.session;
}

export async function createSupabaseAccount(input: {
  email: string;
  password: string;
  captchaToken?: string;
}): Promise<SupabaseAccountResult> {
  const client = requireSupabaseClient();
  const email = input.email.trim().toLowerCase();
  assertAccountCredentials(email, input.password);

  const { data: existing, error: existingError } = await client.auth.getSession();
  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing.session?.user.is_anonymous) {
    const { data, error } = await client.auth.updateUser(
      {
        email,
        password: input.password
      },
      {
        emailRedirectTo: window.location.origin
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      status: data.user.email_confirmed_at ? "signed-in" : "confirmation-sent",
      email,
      message: data.user.email_confirmed_at
        ? "Account is ready for this browser."
        : "Check your email to finish saving this account."
    };
  }

  if (existing.session && !existing.session.user.is_anonymous) {
    return {
      status: "signed-in",
      email: existing.session.user.email ?? email,
      message: "You are already signed in."
    };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: window.location.origin,
      captchaToken: input.captchaToken
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    status: data.session ? "signed-in" : "confirmation-sent",
    email,
    message: data.session
      ? "Account created and signed in."
      : "Check your email to finish creating this account."
  };
}

export async function signInSupabaseAccount(input: {
  email: string;
  password: string;
  captchaToken?: string;
}): Promise<SupabaseAccountResult> {
  const client = requireSupabaseClient();
  const email = input.email.trim().toLowerCase();
  assertAccountCredentials(email, input.password);

  const { error } = await client.auth.signInWithPassword({
    email,
    password: input.password,
    options: {
      captchaToken: input.captchaToken
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    status: "signed-in",
    email,
    message: "Signed in."
  };
}

export async function signOutSupabaseAccount() {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

function getSupabaseClient() {
  const configuredSupabaseUrl = supabaseUrl;
  const configuredPublishableKey = supabasePublishableKey;

  if (!configuredSupabaseUrl || !configuredPublishableKey) {
    return null;
  }

  if (supabaseClient === undefined) {
    supabaseClient = createClient(configuredSupabaseUrl, configuredPublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "sorsorrank-supabase-auth"
      }
    });
  }

  return supabaseClient;
}

function requireSupabaseClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase Auth is not configured.");
  }

  return client;
}

function assertAccountCredentials(email: string, password: string) {
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

function readConfigValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || /^YOUR_/i.test(trimmed) || trimmed.includes("YOUR_PROJECT")) {
    return undefined;
  }

  return trimmed;
}
