import React, { useState, useMemo, useEffect } from "react";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { 
  FileText, Search, Plus, Trash2, Tag, BookOpen, 
  Sparkles, Save, Eye, Edit3, ArrowLeft, Paperclip 
} from "lucide-react";
import { uploadFileOrBase64 } from "../services/db";

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useFirestore();
  const { showToast } = useToast();

  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  // Editor states
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorTags, setEditorTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");

  const [editMode, setEditMode] = useState("edit"); // edit, preview, split
  const [saving, setSaving] = useState(false);
  const [mobileActive, setMobileActive] = useState(false); // list vs editor on mobile
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // AI Mock State (Commented out)
  // const [aiLoading, setAiLoading] = useState(false);

  // 1. Get current active note object
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // 2. Set editor values when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditorTitle(activeNote.title);
      setEditorContent(activeNote.content);
      setEditorSubject(activeNote.subject || "");
      setEditorTags(activeNote.tags || []);
    } else {
      setEditorTitle("");
      setEditorContent("");
      setEditorSubject("");
      setEditorTags([]);
    }
  }, [activeNoteId]);

  // 3. Unique subjects for list filter
  const subjectsList = useMemo(() => {
    const subs = notes.map(n => n.subject || "General");
    return ["All", ...new Set(subs)];
  }, [notes]);

  // 4. Filter notes list
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSubject = selectedSubject === "All" || (n.subject || "General") === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [notes, searchQuery, selectedSubject]);

  // Select first note on load if available
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes]);

  // 5. Handle manual note save
  const handleSave = async () => {
    if (!activeNoteId) return;
    setSaving(true);
    try {
      await updateNote(activeNoteId, {
        title: editorTitle || "Untitled Note",
        content: editorContent,
        subject: editorSubject || "General",
        tags: editorTags
      });
      showToast("Note saved successfully", "success");
    } catch (err) {
      showToast("Failed to save note", "error");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save debouncer
  useEffect(() => {
    if (!activeNoteId) return;
    const delayDebounce = setTimeout(() => {
      updateNote(activeNoteId, {
        title: editorTitle || "Untitled Note",
        content: editorContent,
        subject: editorSubject || "General",
        tags: editorTags
      });
    }, 1500); // Autosave after 1.5s idle

    return () => clearTimeout(delayDebounce);
  }, [editorTitle, editorContent, editorSubject, editorTags]);

  // 6. Add note
  const handleCreateNote = async () => {
    try {
      await addNote({
        title: "New Study Note",
        content: "# New Study Note\n\nWrite your concepts here...",
        subject: "General",
        tags: ["Draft"]
      });
      showToast("New note created", "success");
      
      // Select the newly created note (most recent in store)
      if (notes.length > 0) {
        setActiveNoteId(notes[0].id);
        setMobileActive(true);
      }
    } catch (err) {
      showToast("Failed to create note", "error");
    }
  };

  // 7. Delete note
  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(id);
      showToast("Note deleted", "info");
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setMobileActive(false);
      }
    } catch (err) {
      showToast("Failed to delete note", "error");
    }
  };

  // 8. Tags manager
  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !editorTags.includes(tag)) {
      setEditorTags([...editorTags, tag]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditorTags(editorTags.filter(t => t !== tagToRemove));
  };

  // 9. AI Summarize Mock fetch call (Commented out)
  /*
  const handleAiSummarize = async () => {
    if (!editorContent || editorContent.trim().length < 10) {
      showToast("Write a longer note before summarizing", "warning");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/mock-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summarize_notes",
          payload: { content: editorContent }
        })
      });
      const data = await response.json();

      if (data.success && data.summary) {
        // Append summary to note
        const appendedContent = `${editorContent}\n\n---\n\n${data.summary}`;
        setEditorContent(appendedContent);
        showToast("AI Summary successfully appended to note!", "success");
      } else {
        throw new Error(data.error || "Summarization failed");
      }
    } catch (err) {
      console.error(err);
      showToast("AI Summarization failed. Check server status.", "error");
    } finally {
      setAiLoading(false);
    }
  };
  */

  // 9b. Handle attachment uploads
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeNoteId || !activeNote) return;

    setUploadingAttachment(true);
    try {
      const fileId = Math.random().toString(36).substring(2, 9);
      const path = `users/notes/${activeNoteId}/${fileId}_${file.name}`;
      const url = await uploadFileOrBase64(path, file, isMockMode);

      const newAttachment = {
        name: file.name,
        url: url,
        type: file.type
      };

      const updatedAttachments = [...(activeNote.attachments || []), newAttachment];
      await updateNote(activeNoteId, {
        attachments: updatedAttachments
      });
      showToast("Attachment uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload attachment", "error");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = async (indexToRemove) => {
    if (!activeNoteId || !activeNote) return;
    try {
      const updatedAttachments = (activeNote.attachments || []).filter((_, idx) => idx !== indexToRemove);
      await updateNote(activeNoteId, {
        attachments: updatedAttachments
      });
      showToast("Attachment removed", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove attachment", "error");
    }
  };

  // 10. Markdown preview formatter
  const parseMarkdown = (text = "") => {
    // Very simple regex markdown parser for preview
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-base font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-5 mb-2.5">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-extrabold text-slate-800 dark:text-white mt-6 mb-3 border-b border-slate-200/50 dark:border-slate-800/40 pb-1.5">$1</h2>');
    
    // Bold / Italic
    html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>");
    html = html.replace(/\*(.*)\*/gim, "<em>$1</em>");
    
    // Checklist
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 text-sm my-1"><input type="checkbox" disabled class="rounded text-brand-600"> <span>$1</span></div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 text-sm my-1"><input type="checkbox" checked disabled class="rounded text-brand-600"> <span class="line-through text-slate-400">$1</span></div>');

    // Bullet Lists
    html = html.replace(/^- (?!\[[ x]\])(.*$)/gim, '<li class="ml-4 list-disc text-sm my-1">$1</li>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-brand-500 pl-4 py-1.5 my-3 bg-slate-100 dark:bg-slate-900/40 italic rounded-r text-sm">$1</blockquote>');

    // Code blocks
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs text-brand-500 font-mono">$1</code>');

    // Paragraph splits
    return html.split("\n\n").map(p => {
      if (p.trim().startsWith("<h") || p.trim().startsWith("<blockquote") || p.trim().startsWith("<li") || p.trim().startsWith("<div")) {
        return p;
      }
      return `<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 my-2">${p}</p>`;
    }).join("");
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 relative">
      
      {/* Left Column: Notes List Selector */}
      <div className={`w-full md:w-80 flex-shrink-0 flex flex-col justify-between glass-panel rounded-3xl p-4 space-y-4 ${
        mobileActive ? "hidden md:flex" : "flex"
      }`}>
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              Notes Library
            </h3>
            <button 
              onClick={handleCreateNote}
              className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-brand-500"
            />
          </div>

          {/* Subject category filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-100/50 dark:bg-slate-950/40 border-none rounded-lg px-2.5 py-1 text-[11px] outline-none cursor-pointer"
            >
              {subjectsList.map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Notes items list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setMobileActive(true);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer border text-left space-y-1.5 transition-all ${
                  activeNoteId === note.id
                    ? "bg-brand-500/10 border-brand-500/30"
                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                    {note.title || "Untitled Note"}
                  </span>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                  {note.content?.replace(/[#*`>_\-]/g, "")}
                </p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-semibold">
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                    {note.subject || "General"}
                  </span>
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-12">No drafts found</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Editor Workspace */}
      <div className={`flex-1 flex flex-col justify-between glass-panel rounded-3xl p-5 md:p-6 space-y-4 ${
        mobileActive ? "flex" : "hidden md:flex"
      }`}>
        {activeNote ? (
          <div className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
            
            {/* Editor Top Options Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/40 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileActive(false)}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Draft Title"
                  className="bg-transparent border-none text-lg font-bold text-slate-800 dark:text-white outline-none placeholder-slate-400 w-full sm:w-60"
                />
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* <button
                  onClick={handleAiSummarize}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Summarize</span>
                </button> */}

                {/* Edit/Preview Toggle */}
                <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-slate-400">
                  <button
                    onClick={() => setEditMode("edit")}
                    className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 ${editMode === "edit" ? "text-brand-500" : ""}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditMode("preview")}
                    className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 ${editMode === "preview" ? "text-brand-500" : ""}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Note parameters: Subject + Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {/* Subject selector */}
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Subject:</span>
                <input
                  type="text"
                  value={editorSubject}
                  onChange={(e) => setEditorSubject(e.target.value)}
                  placeholder="General"
                  className="bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-lg px-2 py-0.5 max-w-[120px] outline-none"
                />
              </div>

              {/* Tag system list */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <div className="flex flex-wrap items-center gap-1.5">
                  {editorTags.map((t, idx) => (
                    <span 
                      key={idx} 
                      className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-semibold border border-slate-250/20"
                    >
                      {t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="text-rose-500 font-bold hover:scale-110">×</button>
                    </span>
                  ))}
                  <form onSubmit={handleAddTag} className="inline-block">
                    <input
                      type="text"
                      placeholder="+ Tag"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="bg-transparent border-none text-[10px] w-12 outline-none font-semibold text-brand-500"
                    />
                  </form>
                </div>
              </div>
            </div>

            {/* Note Attachments Section */}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-500">Attachments:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeNote.attachments?.map((att, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 px-2.5 py-1 rounded-xl flex items-center gap-2 text-[10px] font-semibold"
                  >
                    {att.type?.startsWith("image/") ? (
                      <img src={att.url} className="w-4 h-4 object-cover rounded" alt="" />
                    ) : null}
                    <a 
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-brand-600 dark:text-brand-400 hover:underline max-w-[120px] truncate"
                      title={att.name}
                    >
                      {att.name}
                    </a>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAttachment(idx)} 
                      className="text-rose-500 font-bold hover:scale-110 ml-0.5"
                      title="Remove Attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-slate-350 dark:border-slate-850 hover:border-brand-500 hover:text-brand-500 rounded-xl text-[10px] font-bold cursor-pointer transition-colors">
                  {uploadingAttachment ? (
                    <span className="animate-pulse">Uploading...</span>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Add File
                    </>
                  )}
                  <input 
                    type="file" 
                    onChange={handleAttachmentUpload} 
                    disabled={uploadingAttachment}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Editor / Preview Content Splitting */}
            <div className="flex-1 min-h-0 text-left">
              {editMode === "edit" ? (
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Markdown study guide content goes here..."
                  className="w-full h-full bg-transparent border-none outline-none font-sans leading-relaxed resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 text-sm overflow-y-auto animate-fadeIn"
                />
              ) : (
                <div className="w-full h-full overflow-y-auto pr-1">
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none text-left"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(editorContent) }}
                  />
                  {activeNote.attachments?.some(att => att.type?.startsWith("image/")) && (
                    <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Attached Images</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {activeNote.attachments.filter(att => att.type?.startsWith("image/")).map((att, idx) => (
                          <a 
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/30 hover:border-brand-500/30 transition-all bg-slate-100/30 dark:bg-slate-900/10 flex items-center justify-center p-1"
                          >
                            <img 
                              src={att.url} 
                              alt={att.name} 
                              className="max-w-full max-h-full object-contain rounded-lg group-hover:scale-[1.03] transition-transform" 
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Auto-save notification indicator */}
            <div className="text-[10px] text-slate-400 text-right font-medium">
              * Draft automatically saves when typing stops
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <FileText className="w-12 h-12 opacity-30 mb-3" />
            <h3 className="text-base font-semibold">No Note Selected</h3>
            <p className="text-xs max-w-sm mt-1">Select a document from the left library panel or click create to write down formulas and definitions.</p>
          </div>
        )}
      </div>

    </div>
  );
}
