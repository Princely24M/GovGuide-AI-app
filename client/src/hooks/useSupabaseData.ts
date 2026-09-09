import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type PersistentChecklistItem = { id: string; title: string; detail: string; service: string; done: boolean; checklistId: string };
export type PersistentSavedContent = { id: string; title: string; type: string; topic: string; content: string; date: string };
export type PersistentSentiment = { total: number; positive: number; neutral: number; negative: number; score: number; themes: string[]; complaints: string[]; observations: string[]; insights: string };
export type PersistentMessage = { role: "user" | "assistant"; content: string };

type ReferenceServiceRow = { id: string; slug: string; name: string; description: string | null; required_documents: string[] | null; application_steps: string[] | null };

function friendlyDatabaseError() {
  return new Error("We couldn't load or save your GovGuide data. Please try again.");
}

export function useSupabaseData(userId: string | undefined) {
  const [checklist, setChecklist] = useState<PersistentChecklistItem[]>([]);
  const [savedContent, setSavedContent] = useState<PersistentSavedContent[]>([]);
  const [sentiment, setSentiment] = useState<PersistentSentiment | null>(null);
  const [conversationMessages, setConversationMessages] = useState<PersistentMessage[]>([]);
  const [stats, setStats] = useState({ questions: 0, reports: 0, saved: 0 });
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setChecklist([]);
      setSavedContent([]);
      setSentiment(null);
      setConversationMessages([]);
      setStats({ questions: 0, reports: 0, saved: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [checklistsResult, savedResult, sentimentResult, activityResult, reportActivityResult, conversationResult] = await Promise.all([
        supabase.from("checklists").select("id,title,description,service_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("saved_content").select("id,title,content_type,topic,content,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("sentiment_analyses").select("total_records,positive_count,neutral_count,negative_count,sentiment_score,themes,insights,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("activity").select("activity_type").eq("user_id", userId).eq("activity_type", "Asked GovGuide"),
        supabase.from("activity").select("activity_type").eq("user_id", userId).eq("activity_type", "Generated report"),
        supabase.from("conversations").select("id").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const firstError = [checklistsResult.error, savedResult.error, sentimentResult.error, activityResult.error, reportActivityResult.error, conversationResult.error].find(Boolean);
      if (firstError) throw firstError;
      const checklistRows = checklistsResult.data ?? [];
      const checklistIds = checklistRows.map(row => row.id);
      const itemsResult = checklistIds.length ? await supabase.from("checklist_items").select("id,checklist_id,title,description,completed,position").eq("user_id", userId).in("checklist_id", checklistIds).order("position", { ascending: true }) : { data: [], error: null };
      if (itemsResult.error) throw itemsResult.error;
      const checklistById = new Map(checklistRows.map(row => [row.id, row]));
      const mappedChecklist = (itemsResult.data ?? []).map(item => {
        const parent = checklistById.get(item.checklist_id);
        return { id: item.id, title: item.title, detail: item.description ?? parent?.title ?? "GovGuide task", service: parent?.title ?? "Government service", done: Boolean(item.completed), checklistId: item.checklist_id };
      });
      setChecklist(mappedChecklist);
      setSavedContent((savedResult.data ?? []).map(row => ({ id: row.id, title: row.title, type: row.content_type, topic: row.topic, content: row.content, date: new Date(row.created_at).toLocaleDateString() })));
      if (sentimentResult.data) setSentiment({ total: sentimentResult.data.total_records, positive: sentimentResult.data.positive_count, neutral: sentimentResult.data.neutral_count, negative: sentimentResult.data.negative_count, score: sentimentResult.data.sentiment_score, themes: sentimentResult.data.themes ?? [], complaints: [], observations: [], insights: sentimentResult.data.insights ?? "" });
      setStats({ questions: activityResult.data?.length ?? 0, reports: reportActivityResult.data?.length ?? 0, saved: savedResult.data?.length ?? 0 });
      if (conversationResult.data) {
        const messagesResult = await supabase.from("messages").select("role,content").eq("user_id", userId).eq("conversation_id", conversationResult.data.id).order("created_at", { ascending: true });
        if (messagesResult.error) throw messagesResult.error;
        setConversationMessages((messagesResult.data ?? []).filter(message => message.role === "user" || message.role === "assistant") as PersistentMessage[]);
      } else {
        setConversationMessages([]);
      }
    } catch (loadError) {
      setError(friendlyDatabaseError());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void reload(); }, [reload]);

  const addService = useCallback(async (slug: string) => {
    if (!userId) throw friendlyDatabaseError();
    const reference = await supabase.from("services").select("id,slug,name,description,required_documents,application_steps").eq("slug", slug).maybeSingle<ReferenceServiceRow>();
    if (reference.error) throw friendlyDatabaseError();
    if (!reference.data) throw new Error("This service is not available in the verified service catalogue yet.");
    const created = await supabase.from("checklists").insert({ user_id: userId, service_id: reference.data.id, title: reference.data.name, description: reference.data.description }).select("id").single();
    if (created.error || !created.data) throw friendlyDatabaseError();
    const serviceName = reference.data.name;
    const checklistId = created.data.id;
    const taskTitles = [...(reference.data.application_steps ?? []), ...(reference.data.required_documents ?? [])];
    if (taskTitles.length) {
      const items = await supabase.from("checklist_items").insert(taskTitles.map((title, position) => ({ checklist_id: checklistId, user_id: userId, title, description: serviceName, completed: false, position })));
      if (items.error) throw friendlyDatabaseError();
    }
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Added checklist", description: `Added ${reference.data.name} to checklist`, metadata: { service_id: reference.data.id } });
    await reload();
  }, [reload, userId]);

  const toggleItem = useCallback(async (id: string, completed: boolean) => {
    if (!userId) return;
    const result = await supabase.from("checklist_items").update({ completed }).eq("id", id).eq("user_id", userId);
    if (result.error) throw friendlyDatabaseError();
    setChecklist(items => items.map(item => item.id === id ? { ...item, done: completed } : item));
    await supabase.from("activity").insert({ user_id: userId, activity_type: completed ? "Completed checklist item" : "Uncompleted checklist item", description: "Updated checklist progress", metadata: { checklist_item_id: id } });
  }, [userId]);

  const deleteChecklistItem = useCallback(async (id: string) => {
    if (!userId) return;
    const result = await supabase.from("checklist_items").delete().eq("id", id).eq("user_id", userId);
    if (result.error) throw friendlyDatabaseError();
    setChecklist(items => items.filter(item => item.id !== id));
  }, [userId]);

  const saveContent = useCallback(async (content: { title: string; contentType: string; topic: string; audience: string; tone: string; content: string }) => {
    if (!userId) throw friendlyDatabaseError();
    const result = await supabase.from("saved_content").insert({ user_id: userId, content_type: content.contentType, title: content.title, topic: content.topic, audience: content.audience, tone: content.tone, content: content.content }).select("id,title,content_type,topic,content,created_at").single();
    if (result.error) throw friendlyDatabaseError();
    setSavedContent(items => [{ id: result.data.id, title: result.data.title, type: result.data.content_type, topic: result.data.topic, content: result.data.content, date: new Date(result.data.created_at).toLocaleDateString() }, ...items]);
    setStats(current => ({ ...current, saved: current.saved + 1 }));
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Saved content", description: `Saved ${content.title}`, metadata: {} });
  }, [userId]);

  const deleteSavedContent = useCallback(async (id: string) => {
    if (!userId) return;
    const result = await supabase.from("saved_content").delete().eq("id", id).eq("user_id", userId);
    if (result.error) throw friendlyDatabaseError();
    setSavedContent(items => items.filter(item => item.id !== id));
  }, [userId]);

  const saveSentiment = useCallback(async (result: PersistentSentiment, inputType: string, sourceName?: string) => {
    if (!userId) throw friendlyDatabaseError();
    const saved = await supabase.from("sentiment_analyses").insert({ user_id: userId, input_type: inputType, source_name: sourceName ?? null, total_records: result.total, positive_count: result.positive, neutral_count: result.neutral, negative_count: result.negative, sentiment_score: result.score, themes: result.themes, insights: result.insights }).select("id").single();
    if (saved.error) throw friendlyDatabaseError();
    setSentiment(result);
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Analysed sentiment", description: `Analysed ${result.total} feedback records`, metadata: { analysis_id: saved.data?.id } });
  }, [userId]);

  const createReport = useCallback(async (report: { reportType: string; title: string; description: string; data: Record<string, unknown> }) => {
    if (!userId) throw friendlyDatabaseError();
    await saveContent({ title: report.title, contentType: "Sentiment analysis report", topic: report.reportType, audience: "Internal service team", tone: "Plain language", content: `${report.description}\n\n${JSON.stringify(report.data, null, 2)}` });
    setStats(current => ({ ...current, reports: current.reports + 1 }));
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Generated report", description: report.title, metadata: { report_type: report.reportType } });
  }, [saveContent, userId]);

  const recordQuestion = useCallback(async (question: string, answer: string) => {
    if (!userId) throw friendlyDatabaseError();
    const existingConversation = await supabase.from("conversations").select("id").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (existingConversation.error) throw friendlyDatabaseError();
    let conversationId = existingConversation.data?.id;
    if (!conversationId) {
      const created = await supabase.from("conversations").insert({ user_id: userId, title: question.slice(0, 80) }).select("id").single();
      if (created.error) throw friendlyDatabaseError();
      conversationId = created.data.id;
    }
    const messageResult = await supabase.from("messages").insert([{ conversation_id: conversationId, user_id: userId, role: "user", content: question }, { conversation_id: conversationId, user_id: userId, role: "assistant", content: answer }]);
    if (messageResult.error) throw friendlyDatabaseError();
    await supabase.from("activity").insert({ user_id: userId, activity_type: "Asked GovGuide", description: question.slice(0, 120), metadata: { conversation_id: conversationId } });
    setStats(current => ({ ...current, questions: current.questions + 1 }));
  }, [userId]);

  return { checklist, savedContent, sentiment, conversationMessages, stats, loading, error, reload, addService, toggleItem, deleteChecklistItem, saveContent, deleteSavedContent, saveSentiment, createReport, recordQuestion };
}
