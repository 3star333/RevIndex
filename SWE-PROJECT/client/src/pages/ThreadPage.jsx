import { useState, useEffect, useRef } from "react";
import API_URL from "../api/config";
import { useAuth } from "../context/AuthContext";
import { SMILIES, parseSmileyLine } from "../smilies";

const PAGE_SIZE = 10;
const TAG_COLORS = {
  "General": "#808080", "Build Log": "#000080", "Question": "#006400",
  "For Sale": "#8B0000", "Tech": "#4B0082", "Help": "#CC2200", "Off Topic": "#8B4513",
};

export default function ThreadPage({ thread, onBack }) {
  const { user, authHeader } = useAuth();
  const [threadData,   setThreadData]   = useState(null);
  const [comments,     setComments]     = useState([]);
  const [form,         setForm]         = useState({ content: "" });
  const [posting,      setPosting]      = useState(false);
  const [error,        setError]        = useState("");
  const [page,         setPage]         = useState(1);
  const [editingId,    setEditingId]    = useState(null);
  const [editContent,  setEditContent]  = useState("");
  const [showSmilies,  setShowSmilies]  = useState(false);
  const replyRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/threads/${thread.id}`)
      .then(r => r.json()).then(setThreadData).catch(() => setThreadData(thread));
    fetchComments();
  }, [thread.id]); // eslint-disable-line

  async function fetchComments() {
    try {
      const res  = await fetch(`${API_URL}/threads/${thread.id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load comments."); }
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!form.content.trim()) return setError("Reply cannot be empty.");
    setError(""); setPosting(true);
    try {
      const res  = await fetch(`${API_URL}/threads/${thread.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ author: user?.username || "Anonymous", content: form.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newComments = [...comments, data];
      setComments(newComments);
      setForm(f => ({ ...f, content: "" }));
      setPage(Math.ceil((newComments.length + 1) / PAGE_SIZE));
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  }

  async function handleDeleteThread() {
    if (!confirm("Delete this entire thread and all its replies? Cannot be undone.")) return;
    try {
      await fetch(`${API_URL}/threads/${thread.id}`, { method: "DELETE" });
      onBack();
    } catch { setError("Failed to delete thread."); }
  }

  async function handleDeleteComment(cid) {
    if (!confirm("Delete this reply?")) return;
    try {
      await fetch(`${API_URL}/threads/${thread.id}/comments/${cid}`, { method: "DELETE" });
      setComments(prev => prev.filter(c => c.id !== cid));
    } catch { setError("Failed to delete reply."); }
  }

  async function handleLike(cid) {
    try {
      const res  = await fetch(`${API_URL}/threads/${thread.id}/comments/${cid}/like`, { method: "POST" });
      const data = await res.json();
      setComments(prev => prev.map(c => c.id === cid ? { ...c, likes: data.likes } : c));
    } catch { /* silent */ }
  }

  async function handleEditSave(cid) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/threads/${thread.id}/comments/${cid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error();
      setComments(prev => prev.map(c => c.id === cid ? { ...c, content: editContent } : c));
      setEditingId(null);
    } catch { setError("Failed to save edit."); }
  }

  function handleQuote(author, content) {
    const quoted = content.split("\n").map(l => `> ${l}`).join("\n");
    setForm(f => ({ ...f, content: `${quoted}\n\n` }));
    replyRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => replyRef.current?.querySelector("textarea")?.focus(), 300);
  }

  const t = threadData || thread;
  const allPosts = [
    { id: "op", postNum: 1, author: t.author_username || "OP", author_username: t.author_username, author_avatar: t.author_avatar, date: t.created_at, content: t.description || "(No description provided.)", isOP: true },
    ...comments.map((c, i) => ({ ...c, postNum: i + 2, date: c.created_at, isOP: false })),
  ];
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  const pagePosts  = allPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "860px" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", flexWrap: "wrap" }}>
        <button className="win-btn" onClick={onBack}>← The Garage</button>
        <span style={{ color: "#808080" }}>›</span>
        <span style={{ fontWeight: "bold", flex: 1 }}>{t.title}</span>
        {t.tag && (
          <span style={{ background: TAG_COLORS[t.tag] || "#808080", color: "#fff", fontSize: "10px", padding: "2px 7px", fontWeight: "bold" }}>
            {t.tag}
          </span>
        )}
        <button className="win-btn"
          style={{ background: "#8B0000", color: "#fff", minWidth: "unset", padding: "2px 8px", fontSize: "11px" }}
          onClick={handleDeleteThread}>
          🗑 Delete Thread
        </button>
      </div>

      {/* Thread header */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 {t.title}</span>
          <span style={{ fontSize: "11px" }}>{allPosts.length} post{allPosts.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 8px", background: "#000080", color: "#fff" }}>
          {t.vehicle_image ? (
            <img src={`${API_URL}${t.vehicle_image}`} alt=""
              style={{ width: "48px", height: "48px", objectFit: "cover", border: "2px inset #808080" }} />
          ) : (
            <div style={{ width: "48px", height: "48px", background: "#808080", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🚗</div>
          )}
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{t.year} {t.make} {t.model}</div>
            {t.nickname && <div style={{ fontStyle: "italic", fontSize: "12px", opacity: 0.85 }}>&quot;{t.nickname}&quot;</div>}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}

      {pagePosts.map(post => (
        <PostBox key={post.id} post={post}
          onQuote={() => handleQuote(post.author, post.content)}
          onDelete={post.isOP ? null : () => handleDeleteComment(post.id)}
          onLike={post.isOP ? null : () => handleLike(post.id)}
          onEdit={post.isOP ? null : () => { setEditingId(post.id); setEditContent(post.content); }}
          isEditing={editingId === post.id}
          editContent={editContent}
          onEditChange={setEditContent}
          onEditSave={() => handleEditSave(post.id)}
          onEditCancel={() => setEditingId(null)}
        />
      ))}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}

      {/* Reply form */}
      <div className="win-panel" style={{ padding: 0 }} ref={replyRef}>
        <div className="win-title-bar"><span>📝 Post a Reply</span></div>
        <div style={{ padding: "10px" }}>
          {user ? (
            <form onSubmit={handlePost} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "12px", color: "#808080" }}>
                Posting as <strong style={{ color: "#000080" }}>{user.username}</strong>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Reply *</label>
                <textarea className="win-input" rows={5}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Type your reply here..."
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <button type="button" className="win-btn"
                    style={{ minWidth: "unset", padding: "2px 8px", fontSize: "11px" }}
                    onClick={() => setShowSmilies(s => !s)}>
                    😊 Smilies
                  </button>
                  {showSmilies && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 4px)", left: 0,
                      background: "#C0C0C0", border: "2px outset #fff",
                      boxShadow: "2px 2px 0 #000",
                      display: "grid", gridTemplateColumns: "repeat(8, 28px)",
                      gap: "2px", padding: "6px", zIndex: 100,
                      maxHeight: "200px", overflowY: "auto", width: "248px",
                    }}>
                      {SMILIES.map(s => (
                        <button key={s.code} type="button" title={s.code}
                          style={{ width: "28px", height: "28px", background: "none", border: "1px solid transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#000080"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                          onClick={() => {
                            setForm(f => ({ ...f, content: f.content + s.code }));
                            setShowSmilies(false);
                          }}>
                          <img src={`/smilies/${s.file}`} alt={s.alt} style={{ width: "20px", height: "20px", imageRendering: "pixelated" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" className="win-btn"
                  style={{ minWidth: "unset", padding: "2px 8px", fontSize: "11px" }}
                  onClick={() => {
                    const url = prompt("Paste a YouTube or Vimeo URL:");
                    if (url) setForm(f => ({ ...f, content: f.content + (f.content ? "\n" : "") + url }));
                  }}>
                  📹 Embed Video
                </button>
                <div style={{ flex: 1 }} />
                <button type="submit" className="win-btn win-btn-primary" disabled={posting}>
                  {posting ? "Posting…" : "[ Post Reply ]"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: "12px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
              You must be <strong>logged in</strong> to reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center", padding: "4px" }}>
      <button className="win-btn" style={{ minWidth: "unset", padding: "2px 8px" }} disabled={page === 1} onClick={() => onPage(1)}>«</button>
      <button className="win-btn" style={{ minWidth: "unset", padding: "2px 8px" }} disabled={page === 1} onClick={() => onPage(p => Math.max(1, p - 1))}>‹</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} className="win-btn"
          style={{ minWidth: "unset", padding: "2px 8px", background: p === page ? "#000080" : "#C0C0C0", color: p === page ? "#fff" : "#000" }}
          onClick={() => onPage(p)}>{p}</button>
      ))}
      <button className="win-btn" style={{ minWidth: "unset", padding: "2px 8px" }} disabled={page === totalPages} onClick={() => onPage(p => Math.min(totalPages, p + 1))}>›</button>
      <button className="win-btn" style={{ minWidth: "unset", padding: "2px 8px" }} disabled={page === totalPages} onClick={() => onPage(totalPages)}>»</button>
    </div>
  );
}

function PostBox({ post, onQuote, onDelete, onLike, onEdit, isEditing, editContent, onEditChange, onEditSave, onEditCancel }) {
  const { postNum, author, author_username, author_avatar, author_profile_gif, author_signature, date, content, isOP, likes } = post;
  const displayName   = author_username || author || "Anonymous";
  const formattedDate = date ? new Date(date).toLocaleString() : "";

  // Parse content: detect YouTube/Vimeo URLs and render as embeds
  function renderContent(text) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const ytMatch = line.trim().match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
      const vmMatch = line.trim().match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
      if (ytMatch) {
        return (
          <div key={i} style={{ margin: "6px 0" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
              style={{ width: "100%", maxWidth: "480px", aspectRatio: "16/9", border: "2px inset #808080" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="YouTube video" />
          </div>
        );
      }
      if (vmMatch) {
        return (
          <div key={i} style={{ margin: "6px 0" }}>
            <iframe
              src={`https://player.vimeo.com/video/${vmMatch[1]}`}
              style={{ width: "100%", maxWidth: "480px", aspectRatio: "16/9", border: "2px inset #808080" }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen title="Vimeo video" />
          </div>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <div key={i} style={{ borderLeft: "3px solid #808080", paddingLeft: "8px", color: "#555", fontStyle: "italic", marginBottom: "2px" }}>
            {parseSmileyLine(line.slice(2), `q${i}`)}
          </div>
        );
      }
      return <span key={i}>{parseSmileyLine(line, `l${i}`)}<br /></span>;
    });
  }

  return (
    <div className="win-panel" style={{ padding: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", minHeight: "80px" }}>

        {/* Left: user card */}
        <div style={{
          borderRight: "2px solid #808080", padding: "10px 8px",
          background: isOP ? "#000080" : "#404040", color: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
        }}>
          <div style={{ width: "44px", height: "44px", background: "#C0C0C0", border: "2px outset #fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            {author_avatar
              ? <img src={author_avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : isOP ? "👤" : "💬"}
          </div>
          <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", wordBreak: "break-all" }}>{displayName}</div>
          {isOP && (
            <div style={{ fontSize: "10px", background: "#FFD700", color: "#000", padding: "1px 4px", fontWeight: "bold" }}>OP</div>
          )}
          <div style={{ fontSize: "10px", color: "#C0C0C0", marginTop: "2px" }}>Post #{postNum}</div>
          {!isOP && likes > 0 && (
            <div style={{ fontSize: "10px", color: "#FFD700", marginTop: "2px" }}>👍 {likes}</div>
          )}
          {author_profile_gif && (
            <img src={author_profile_gif} alt="" style={{ width: "56px", marginTop: "4px" }}
              onError={e => { e.target.style.display = "none"; }} />
          )}
        </div>

        {/* Right: content */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Meta bar */}
          <div style={{ background: "#000080", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 8px", fontSize: "11px" }}>
            <span>#{postNum} — {formattedDate}</span>
            <div style={{ display: "flex", gap: "3px" }}>
              {!isOP && onLike && (
                <button className="win-btn" style={{ minWidth: "unset", padding: "1px 6px", fontSize: "10px" }} onClick={onLike}>
                  👍 {likes || 0}
                </button>
              )}
              {onQuote && (
                <button className="win-btn" style={{ minWidth: "unset", padding: "1px 6px", fontSize: "10px" }} onClick={onQuote}>
                  💬 Quote
                </button>
              )}
              {!isOP && onEdit && (
                <button className="win-btn" style={{ minWidth: "unset", padding: "1px 6px", fontSize: "10px" }} onClick={onEdit}>
                  ✏ Edit
                </button>
              )}
              {!isOP && onDelete && (
                <button className="win-btn" style={{ minWidth: "unset", padding: "1px 6px", fontSize: "10px", background: "#8B0000", color: "#fff" }} onClick={onDelete}>
                  🗑
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {isEditing ? (
            <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <textarea className="win-input" rows={4}
                style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                value={editContent} onChange={e => onEditChange(e.target.value)} />
              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                <button className="win-btn" style={{ minWidth: "unset", padding: "2px 8px", fontSize: "11px" }} onClick={onEditCancel}>Cancel</button>
                <button className="win-btn win-btn-primary" style={{ minWidth: "unset", padding: "2px 8px", fontSize: "11px" }} onClick={onEditSave}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ padding: "8px 10px", fontSize: "12px", lineHeight: "1.7", flex: 1 }}>
                {renderContent(content)}
              </div>
              {author_signature && (
                <div style={{ borderTop: "1px dashed #808080", margin: "0 10px 6px", paddingTop: "4px", fontSize: "10px", color: "#808080", fontStyle: "italic" }}>
                  {author_signature}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
