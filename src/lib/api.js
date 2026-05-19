import { supabase } from "./supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  return unwrap(await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  }));
}

export async function signOut() {
  return unwrap(await supabase.auth.signOut());
}

export async function getProfile(userId) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*, team:teams(id,name,color,slug)")
      .eq("id", userId)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function getProfiles() {
  return unwrap(await supabase.from("profiles").select("*").order("full_name"));
}

export async function upsertProfile(profile) {
  return unwrap(await supabase.from("profiles").upsert(profile).select().single());
}

export async function toggleProfileActive(id, isActive) {
  return unwrap(await supabase.from("profiles").update({ is_active: isActive }).eq("id", id).select().single());
}

export async function getTeams() {
  return unwrap(await supabase.from("teams").select("*").order("name"));
}

export async function createTeam(team) {
  return unwrap(await supabase.from("teams").insert(team).select().single());
}

export async function getRequestTypes() {
  return unwrap(await supabase.from("request_types").select("*").order("name"));
}

export async function createRequestType(type) {
  return unwrap(await supabase.from("request_types").insert(type).select().single());
}

export async function getRequests() {
  return unwrap(await supabase
    .from("requests")
    .select("*, team:teams(*), type:request_types(*), requester:profiles!requests_requester_id_fkey(*), assignee:profiles!requests_assignee_id_fkey(*)")
    .order("updated_at", { ascending: false }));
}

export async function createRequest(request) {
  return unwrap(await supabase.from("requests").insert(request).select().single());
}

export async function updateRequest(id, patch) {
  return unwrap(await supabase.from("requests").update(patch).eq("id", id).select().single());
}

export async function getComments(requestId) {
  return unwrap(await supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}

export async function createComment(comment) {
  return unwrap(await supabase.from("comments").insert(comment).select().single());
}

export async function getAttachments(requestId) {
  return unwrap(await supabase
    .from("attachments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}

export async function uploadAttachment(requestId, uploaderId, file) {
  const path = `${requestId}/${Date.now()}-${file.name}`;
  unwrap(await supabase.storage.from("attachments").upload(path, file));
  return unwrap(await supabase
    .from("attachments")
    .insert({
      request_id: requestId,
      uploader_id: uploaderId,
      file_name: file.name,
      file_size: file.size,
      file_path: path,
    })
    .select()
    .single());
}

export async function getHistory(requestId) {
  return unwrap(await supabase
    .from("request_history")
    .select("*, actor:profiles(*)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}
