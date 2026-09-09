import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type PersistentChecklistItem = { id: string; title: string; detail: string; service: string; done: boolean; checklistId: string };
export type PersistentSavedContent = { id: string; title: string; type: string; topic: string; content: string; date: string };
export type PersistentSentiment = { total: number; positive: number; neutral: number; negative: number; score: number; themes: string[]; complaints: string[]; observations: string[]; insights: string };
export type PersistentMessage = { id?: string; role: "user" | "assistant"; content: string };
export type PersistentConversation = { id: string; title: string; createdAt: string; updatedAt: string; isSaved: boolean; savedAt?: string | null };
export type PersistentReport = { id: string; reportType: string; title: string; description: string; analysisId?: string | null; data: Record<string, unknown>; createdAt: string };
export type PersistentActivity = { id: string; activityType: string; description: string; createdAt: string };

type ReferenceServiceRow = { id: string; slug: string; name: string; description: string | null; required_documents: string[] | null; application_steps: string[] | null };
const friendlyDatabaseError = () => new Error("We couldn't load or save your GovGuide data. Please try again.");

export function useSupabaseData(userId: string | undefined) {
  const [checklist, setChecklist] = useState<PersistentChecklistItem[]>([]);
  const [savedContent, setSavedContent] = useState<PersistentSavedContent[]>([]);
  const [sentiment, setSentiment] = useState<PersistentSentiment | null>(null);
  const [conversationMessages, setConversationMessages] = useState<PersistentMessage[]>([]);
  const [conversations, setConversations] = useState<PersistentConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [reports, setReports] = useState<PersistentReport[]>([]);
  const [activity, setActivity] = useState<PersistentActivity[]>([]);
  const [stats, setStats] = useState({ questions: 0, reports: 0, saved: 0 });
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;
    const result = await supabase.from("messages").select("id,role,content").eq("user_id", userId).eq("conversation_id", conversationId).order("created_at", { ascending: true });
    if (result.error) throw friendlyDatabaseError();
    setActiveConversationId(conversationId);
    setConversationMessages((result.data ?? []).filter(message => message.role === "user" || message.role === "assistant") as PersistentMessage[]);
  }, [userId]);

  const reload = useCallback(async () => {
    if (!userId) {
      setChecklist([]); setSavedContent([]); setSentiment(null); setConversationMessages([]); setConversations([]); setReports([]); setActivity([]); setActiveConversationId(null); setStats({ questions: 0, reports: 0, saved: 0 }); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const [checklistsResult, savedResult, sentimentResult, conversationsResult, reportsResult, activityResult] = await Promise.all([
        supabase.from("checklists").select("id,title,description,service_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("saved_content").select("id,title,content_type,topic,content,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("sentiment_analyses").select("id,total_records,positive_count,neutral_count,negative_count,sentiment_score,themes,insights,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("conversations").select("id,title,created_at,updated_at,is_saved,saved_at").eq("user_id", userId).order("updated_at", { ascending: false }),
        supabase.from("reports").select("id,report_type,title,description,analysis_id,data,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("activity").select("id,activity_type,description,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
      ]);
      const firstError = [checklistsResult.error, savedResult.error, sentimentResult.error, conversationsResult.error, reportsResult.error, activityResult.error].find(Boolean);
      if (firstError) throw firstError;
      const checklistRows = checklistsResult.data ?? [];
      const ids = checklistRows.map(row => row.id);
      const itemsResult = ids.length ? await supabase.from("checklist_items").select("id,checklist_id,title,description,completed,position").eq("user_id", userId).in("checklist_id", ids).order("position", { ascending: true }) : { data: [], error: null };
      if (itemsResult.error) throw itemsResult.error;
      const parents = new Map(checklistRows.map(row => [row.id, row]));
      setChecklist((itemsResult.data ?? []).map(item => { const parent = parents.get(item.checklist_id); return { id: item.id, title: item.title, detail: item.description ?? parent?.title ?? "GovGuide task", service: parent?.title ?? "Government service", done: Boolean(item.completed), checklistId: item.checklist_id }; }));
      setSavedContent((savedResult.data ?? []).map(row => ({ id: row.id, title: row.title, type: row.content_type, topic: row.topic, content: row.content, date: new Date(row.created_at).toLocaleDateString() })));
      if (sentimentResult.data) setSentiment({ total: sentimentResult.data.total_records, positive: sentimentResult.data.positive_count, neutral: sentimentResult.data.neutral_count, negative: sentimentResult.data.negative_count, score: sentimentResult.data.sentiment_score, themes: sentimentResult.data.themes ?? [], complaints: [], observations: [], insights: sentimentResult.data.insights ?? "" });
      const mappedConversations = (conversationsResult.data ?? []).map(row => ({ id: row.id, title: row.title || "Untitled conversation", createdAt: row.created_at, updatedAt: row.updated_at, isSaved: Boolean(row.is_saved), savedAt: row.saved_at }));
      setConversations(mappedConversations);
      setReports((reportsResult.data ?? []).map(row => ({ id: row.id, reportType: row.report_type, title: row.title, description: row.description ?? "", analysisId: row.analysis_id, data: (row.data ?? {}) as Record<string, unknown>, createdAt: row.created_at })));
      setActivity((activityResult.data ?? []).map(row => ({ id: row.id, activityType: row.activity_type, description: row.description, createdAt: row.created_at })));
      setStats({ questions: (activityResult.data ?? []).filter(row => row.activity_type === "Asked GovGuide").length, reports: reportsResult.data?.length ?? 0, saved: savedResult.data?.length ?? 0 });
      const nextConversation = activeConversationId && mappedConversations.some(item => item.id === activeConversationId) ? activeConversationId : mappedConversations[0]?.id ?? null;
      if (nextConversation) await loadConversation(nextConversation); else { setActiveConversationId(null); setConversationMessages([]); }
    } catch { setError(friendlyDatabaseError()); } finally { setLoading(false); }
  }, [activeConversationId, loadConversation, userId]);

  useEffect(() => { void reload(); }, [reload]);

  const addService = useCallback(async (serviceInput: { slug: string; name: string; steps?: string[]; documents?: string[] }) => {
    if (!userId) throw friendlyDatabaseError();
    const reference = await supabase.from("services").select("id,slug,name,description,required_documents,application_steps").limit(500);
    const normalize = (value: string) => value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const aliases: Record<string, string[]> = {
      "smart-id": ["smart-id-card"],
      "vehicle-licence-renewal": ["motor-vehicle-licence-renewal"],
      "business-registration": ["business-company-registration"],
    };
    const inputSlug = normalize(serviceInput.slug);
    const service = ((reference.data ?? []) as ReferenceServiceRow[]).find(row => row.slug === serviceInput.slug || normalize(row.slug) === inputSlug || (aliases[inputSlug] ?? []).includes(normalize(row.slug)) || normalize(row.name) === normalize(serviceInput.name) || normalize(row.name).includes(normalize(serviceInput.name)) || normalize(serviceInput.name).includes(normalize(row.name)));
    if (reference.error || !service) throw new Error("We couldn’t match this service to the public Supabase services table. Please refresh the Services page and try again.");
    const existing = await supabase.from("checklists").select("id").eq("user_id", userId).eq("service_id", service.id).maybeSingle();
    if (existing.error) throw friendlyDatabaseError();
    if (existing.data) return { added: false, checklistId: existing.data.id };
    const created = await supabase.from("checklists").insert({ user_id: userId, service_id: service.id, title: service.name, description: service.description }).select("id").single();
    if (created.error || !created.data) throw friendlyDatabaseError();
    const templates = await supabase.from("service_checklist_templates").select("title,position").eq("service_id", service.id).order("position", { ascending: true });
    const templateTitles = templates.error ? [] : (templates.data ?? []).map(template => template.title);
    const taskTitles = templateTitles.length ? templateTitles : [...(service.application_steps ?? serviceInput.steps ?? []), ...(service.required_documents ?? serviceInput.documents ?? [])];
    const effectiveTasks = taskTitles.length ? taskTitles : ["Review service requirements", "Prepare required documents", "Complete the application", "Submit the application", "Track the application"];
    const items = await supabase.from("checklist_items").insert(effectiveTasks.map((title, position) => ({ checklist_id: created.data.id, user_id: userId, title, description: service.name, completed: false, position })));
    if (items.error) throw friendlyDatabaseError();
    setChecklist(current => [...effectiveTasks.map((title, index) => ({ id: `${created.data.id}-${index}`, checklistId: created.data.id, title, detail: service.name, service: serviceInput.slug, done: false })), ...current]);
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Added service to checklist", description: `Added ${service.name} to checklist`, metadata: { service_id: service.id } });
    await reload();
    return { added: true, checklistId: created.data.id };
  }, [reload, userId]);

  const toggleItem = useCallback(async (id: string, completed: boolean) => { if (!userId) return; const result = await supabase.from("checklist_items").update({ completed }).eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setChecklist(items => items.map(item => item.id === id ? { ...item, done: completed } : item)); await supabase.from("activity").insert({ user_id: userId, activity_type: completed ? "Completed checklist item" : "Uncompleted checklist item", description: "Updated checklist progress", metadata: { checklist_item_id: id } }); }, [userId]);
  const deleteChecklistItem = useCallback(async (id: string) => { if (!userId) return; const result = await supabase.from("checklist_items").delete().eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setChecklist(items => items.filter(item => item.id !== id)); }, [userId]);
  const deleteChecklist = useCallback(async (checklistId: string) => { if (!userId) return; const result = await supabase.from("checklists").delete().eq("id", checklistId).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); await reload(); }, [reload, userId]);

  const saveContent = useCallback(async (content: { title: string; contentType: string; topic: string; audience: string; tone: string; content: string }) => { if (!userId) throw friendlyDatabaseError(); const result = await supabase.from("saved_content").insert({ user_id: userId, content_type: content.contentType, title: content.title, topic: content.topic, audience: content.audience, tone: content.tone, content: content.content }).select("id,title,content_type,topic,content,created_at").single(); if (result.error) throw friendlyDatabaseError(); setSavedContent(items => [{ id: result.data.id, title: result.data.title, type: result.data.content_type, topic: result.data.topic, content: result.data.content, date: new Date(result.data.created_at).toLocaleDateString() }, ...items]); setStats(current => ({ ...current, saved: current.saved + 1 })); await supabase.from("activity").insert({ user_id: userId, activity_type: "Saved content", description: `Saved ${content.title}`, metadata: {} }); }, [userId]);
  const deleteSavedContent = useCallback(async (id: string) => { if (!userId) return; const result = await supabase.from("saved_content").delete().eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setSavedContent(items => items.filter(item => item.id !== id)); }, [userId]);
  const saveSentiment = useCallback(async (result: PersistentSentiment, inputType: string, sourceName?: string) => { if (!userId) throw friendlyDatabaseError(); const saved = await supabase.from("sentiment_analyses").insert({ user_id: userId, input_type: inputType, source_name: sourceName ?? null, total_records: result.total, positive_count: result.positive, neutral_count: result.neutral, negative_count: result.negative, sentiment_score: result.score, themes: result.themes, insights: result.insights }).select("id").single(); if (saved.error || !saved.data) throw friendlyDatabaseError(); setSentiment(result); await supabase.from("activity").insert({ user_id: userId, activity_type: "Completed sentiment analysis", description: `Analysed ${result.total} feedback records`, metadata: { analysis_id: saved.data.id } }); return saved.data.id; }, [userId]);

  const createReport = useCallback(async (report: { reportType: string; title: string; description: string; analysisId?: string | null; data: Record<string, unknown> }) => { if (!userId) throw friendlyDatabaseError(); const result = await supabase.from("reports").insert({ user_id: userId, report_type: report.reportType, title: report.title, description: report.description, analysis_id: report.analysisId ?? null, data: report.data }).select("id,report_type,title,description,analysis_id,data,created_at").single(); if (result.error) throw friendlyDatabaseError(); const mapped = { id: result.data.id, reportType: result.data.report_type, title: result.data.title, description: result.data.description ?? "", analysisId: result.data.analysis_id, data: (result.data.data ?? {}) as Record<string, unknown>, createdAt: result.data.created_at }; setReports(items => [mapped, ...items]); setStats(current => ({ ...current, reports: current.reports + 1 })); await supabase.from("activity").insert({ user_id: userId, activity_type: "Generated sentiment report", description: report.title, metadata: { report_id: result.data.id } }); }, [userId]);
  const deleteReport = useCallback(async (id: string) => { if (!userId) return; const result = await supabase.from("reports").delete().eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setReports(items => items.filter(item => item.id !== id)); }, [userId]);

  const newConversation = useCallback(async () => { if (!userId) throw friendlyDatabaseError(); const result = await supabase.from("conversations").insert({ user_id: userId, title: "New conversation", is_saved: false }).select("id,title,created_at,updated_at,is_saved,saved_at").single(); if (result.error) throw friendlyDatabaseError(); const item = { id: result.data.id, title: result.data.title, createdAt: result.data.created_at, updatedAt: result.data.updated_at, isSaved: Boolean(result.data.is_saved), savedAt: result.data.saved_at }; setConversations(items => [item, ...items]); setActiveConversationId(item.id); setConversationMessages([]); return item.id; }, [userId]);
  const recordQuestion = useCallback(async (question: string, answer: string, conversationId?: string) => { if (!userId) throw friendlyDatabaseError(); let id: string; if (conversationId) id = conversationId; else if (activeConversationId) id = activeConversationId; else id = await newConversation(); const first = await supabase.from("messages").insert({ conversation_id: id, user_id: userId, role: "user", content: question }); if (first.error) throw friendlyDatabaseError(); const second = await supabase.from("messages").insert({ conversation_id: id, user_id: userId, role: "assistant", content: answer }); if (second.error) throw friendlyDatabaseError(); if (conversations.find(item => item.id === id)?.title === "New conversation") await supabase.from("conversations").update({ title: question.slice(0, 80), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId); await supabase.from("activity").insert({ user_id: userId, activity_type: "Asked GovGuide", description: question.slice(0, 120), metadata: { conversation_id: id } }); setStats(current => ({ ...current, questions: current.questions + 1 })); await loadConversation(id); await reload(); }, [activeConversationId, conversations, loadConversation, newConversation, reload, userId]);
  const updateConversation = useCallback(async (id: string, changes: { title?: string; is_saved?: boolean }) => { if (!userId) throw friendlyDatabaseError(); const result = await supabase.from("conversations").update({ ...changes, saved_at: changes.is_saved === true ? new Date().toISOString() : changes.is_saved === false ? null : undefined }).eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setConversations(items => items.map(item => item.id === id ? { ...item, title: changes.title ?? item.title, isSaved: changes.is_saved ?? item.isSaved, savedAt: changes.is_saved ? new Date().toISOString() : changes.is_saved === false ? null : item.savedAt } : item)); }, [userId]);
  const deleteConversation = useCallback(async (id: string) => { if (!userId) return; const result = await supabase.from("conversations").delete().eq("id", id).eq("user_id", userId); if (result.error) throw friendlyDatabaseError(); setConversations(items => items.filter(item => item.id !== id)); if (activeConversationId === id) { setActiveConversationId(null); setConversationMessages([]); } }, [activeConversationId, userId]);

  return { checklist, savedContent, sentiment, conversationMessages, conversations, activeConversationId, reports, activity, stats, loading, error, reload, loadConversation, addService, toggleItem, deleteChecklistItem, deleteChecklist, saveContent, deleteSavedContent, saveSentiment, createReport, deleteReport, newConversation, recordQuestion, updateConversation, deleteConversation };
}
