import { http } from "./api";

// Agent 3 (AM Account Context Assembly & Post-Call Action) is mounted under
// /agent3 in the unified backend app (see Hackathon-Sales-Channels-Operations-Agent/main.py).
const AGENT3_BASE = "/agent3";
const API_ROOT = import.meta.env.VITE_API_URL || "/api";

// The transcribe/notes endpoints take multipart form data, which the shared
// axios instance's default JSON Content-Type header would corrupt (it drops
// the multipart boundary) — so these two go through a plain fetch() instead.
async function postForm(path, formData) {
  const res = await fetch(`${API_ROOT}${AGENT3_BASE}${path}`, { method: "POST", body: formData });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch {
      // response wasn't JSON — fall back to the status line above
    }
    throw new Error(detail);
  }
  return res.json();
}

export function fetchUpcomingMeetings(amRep) {
  return http.get(`${AGENT3_BASE}/api/meetings/upcoming`, amRep ? { am_rep: amRep } : undefined);
}
export function fetchBriefing(accountId) {
  return http.get(`${AGENT3_BASE}/api/accounts/${encodeURIComponent(accountId)}/briefing`);
}
export function transcribeAudio(accountId, audioBlob, filename = "call.webm") {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  return postForm(`/api/accounts/${encodeURIComponent(accountId)}/transcribe`, formData);
}
export function submitCallNotes(accountId, { meetingId, amRep, notesText }) {
  const formData = new FormData();
  formData.append("meeting_id", meetingId);
  formData.append("am_rep", amRep);
  formData.append("notes_text", notesText);
  return postForm(`/api/accounts/${encodeURIComponent(accountId)}/notes`, formData);
}
export function approveActions(accountId, body) {
  return http.post(`${AGENT3_BASE}/api/accounts/${encodeURIComponent(accountId)}/approve-actions`, body);
}
