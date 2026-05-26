import { supabase } from "./supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
]);

export async function getSession() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    8000,
    "Tempo esgotado ao verificar sessão"
  );
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({
      email,
      password,
    }),
    12000,
    "Tempo esgotado ao entrar. Tente novamente."
  );
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

export async function createUser(userData, authToken) {
  const response = await fetch(
    "https://bofdapvhuehclhdmkpsu.supabase.co/functions/v1/create-user",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(userData),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro ao criar usuário");
  return data;
}

export async function updateUserPassword(userId, newPassword, authToken) {
  const response = await fetch(
    "https://bofdapvhuehclhdmkpsu.supabase.co/functions/v1/update-user-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        user_id: userId,
        new_password: newPassword,
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro ao alterar senha");
  return data;
}

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, whatsapp, avatar_url, team_id, teams(id, name, color, slug)")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("getProfile error:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("getProfile exception:", err);
    return null;
  }
}

export async function getProfiles() {
  const { data, error } = await withTimeout(
    supabase.from("profiles").select("*").order("full_name"),
    12000,
    "Tempo esgotado ao carregar perfis"
  );
  if (error) throw error;
  return data || [];
}

export async function getAvailableAssignees() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, team_id, whatsapp")
    .in("role", ["admin", "supervisor", "gestor", "membro_equipe"])
    .eq("is_active", true)
    .order("full_name");
  if (error) {
    console.error("getAvailableAssignees error:", error);
    return [];
  }
  return data || [];
}

export async function upsertProfile(profile) {
  return unwrap(await supabase.from("profiles").upsert(profile).select().single());
}

export async function toggleProfileActive(id, isActive) {
  return unwrap(await supabase.from("profiles").update({ is_active: isActive }).eq("id", id).select().single());
}

export async function uploadAvatar(userId, file) {
  try {
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;

    await supabase.storage
      .from("request-attachments")
      .remove([path]);

    const { error: upErr } = await supabase.storage
      .from("request-attachments")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (upErr) {
      console.error("Avatar upload error:", upErr);
      throw upErr;
    }

    const { data: urlData } = supabase.storage
      .from("request-attachments")
      .getPublicUrl(path);

    const avatarUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (updateErr) {
      console.error("Avatar profile update error:", updateErr);
      throw updateErr;
    }

    return avatarUrl;
  } catch (err) {
    console.error("uploadAvatar error:", err);
    throw err;
  }
}

export async function getTeams() {
  const { data, error } = await withTimeout(
    supabase.from("teams").select("*").order("name"),
    12000,
    "Tempo esgotado ao carregar equipes"
  );
  if (error) throw error;
  return data || [];
}

export async function createTeam(team) {
  return unwrap(await supabase.from("teams").insert(team).select().single());
}

export async function getRequestTypes() {
  const { data, error } = await withTimeout(
    supabase.from("request_types").select("*").order("name"),
    12000,
    "Tempo esgotado ao carregar tipos"
  );
  if (error) throw error;
  return data || [];
}

export async function createRequestType(type) {
  return unwrap(await supabase.from("request_types").insert(type).select().single());
}

export async function getRequests() {
  const select = "*,team:teams(*),type:request_types(*),requester:profiles!requests_requester_id_fkey(*),assignee:profiles!requests_assignee_id_fkey(*)";
  const { data, error } = await withTimeout(
    supabase.from("requests").select(select).order("updated_at", { ascending: false }),
    15000,
    "Tempo esgotado ao carregar solicitações"
  );
  if (error) throw error;
  return data || [];
}

export async function createRequest(request) {
  const { data: result, error } = await supabase
    .from("requests")
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateRequest(id, patch) {
  const { data, error } = await supabase
    .from("requests")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateRequest error:", error);
    throw error;
  }
  return data;
}

export async function createAuditLog({
  actorId,
  actorName,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  description,
}) {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: actorId,
      actor_name: actorName,
      action,
      entity,
      entity_id: entityId,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      description,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Erro ao salvar audit log:", err);
  }
}

export async function getAuditLogs() {
  const { data, error } = await withTimeout(
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    12000,
    "Tempo esgotado ao carregar auditoria"
  );
  if (error) throw error;
  return data || [];
}

export async function getComments(requestId) {
  return unwrap(await supabase
    .from("request_comments")
    .select("*, author:profiles(id,full_name,avatar_url)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}

export async function createComment(comment) {
  const { data, error } = await supabase
    .from("request_comments")
    .insert(comment)
    .select("*, author:profiles(id,full_name,avatar_url)")
    .single();
  if (error) {
    console.error("createComment error:", error);
    throw error;
  }
  return data;
}

export async function getAttachments(requestId) {
  return unwrap(await supabase
    .from("request_attachments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}

export async function uploadAttachment(requestId, uploaderId, file) {
  const path = `${requestId}/${Date.now()}_${file.name}`;

  const { error: upErr } = await supabase.storage
    .from("request-attachments")
    .upload(path, file);

  if (upErr) {
    console.error("Storage upload error:", upErr);
    throw upErr;
  }

  const { data, error } = await supabase
    .from("request_attachments")
    .insert({
      request_id: requestId,
      uploader_id: uploaderId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (error) {
    console.error("Attachment insert error:", error);
    throw error;
  }
  return data;
}

export async function getAttachmentUrl(path) {
  const { data, error } = await supabase.storage
    .from("request-attachments")
    .createSignedUrl(path, 3600);
  if (error) {
    console.error("getAttachmentUrl error:", error);
    return null;
  }
  return data?.signedUrl;
}

export async function getAttachmentDownloadUrl(filePath) {
  return getAttachmentUrl(filePath);
}

export async function getHistory(requestId) {
  return unwrap(await supabase
    .from("request_history")
    .select("*, actor:profiles(*)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true }));
}
