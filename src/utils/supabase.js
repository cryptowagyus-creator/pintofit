const SUPABASE_URL = 'https://gkxnakrakeewuzpagahy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreG5ha3Jha2Vld3V6cGFnYWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODA0NDYsImV4cCI6MjA5MDQ1NjQ0Nn0.mia93X_RHnhgZTfmSTjg2H9t2zhUFNTJ-9qvq-7fhdg';

export function getAvatarUrl(userKey) {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${userKey}`;
}

export async function uploadAvatar(userKey, localUri) {
  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${userKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'x-upsert': 'true',
      'Content-Type': blob.type || 'image/jpeg',
    },
    body: blob,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
}
