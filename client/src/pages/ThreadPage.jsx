import { useState, useEffect } from "react";
import API_URL from "../api/config";

export default function ThreadPage({ thread, onBack }) {
  const [threadData, setThreadData] = useState(null);
  const [comments, setComments]     = useState([]);
  const [form, setForm]             = useState({ author: "", content: "" });
  const [posting, setPosting]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    fetch(`${API_URL}/threads/${thread.id}`)
      .then(r => r.json()).then(setThreadData).catch(() => setThreadData(thread));
    fetchComments();
  }, [thread.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setError("");
    setPosting(true);
    try {
      const res  = await fetch(`${API_URL}/threads/${thread.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: form.author || "Anonymous", content: form.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => [...prev, data]);
      setForm(f => ({ ...f, content: "" }));
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  }

  const t = threadData || thread;
  const totalPosts = 1 + comments.length; // OP + replies

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "860px" }}>

      {/* Breadcrumb nav */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px" }}>
        <button className="win-btn" onClick={onBack}>← The Garage</button>
        <span style={{ color: "#808080" }}>›</span>
        <span style={{ fontWeight: "bold" }}>{t.title}</span>
      </div>

      {/* Thread header */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 {t.title}</span>
          <span style={{ fontSize: "11px" }}>{totalPosts} post{totalPosts !== 1 ? "s" : ""}</span>
        </div>
        {/* Vehicle info bar */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 8px", background: "#000080", color: "#fff" }}>
          {t.vehicle_image ? (
            <img src={`${API_URL}${t.vehicle_image}`} alt=""
              style={{ width: "48px", height: "48px", objectFit: "cover", border: "2px inset #808080" }} />
          ) : (
            <div style={{ width: "48px", height: "48px", background: "#808080", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🚗</div>
          )}
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>
              {t.year} {t.make} {t.model}
            </div>
            {t.nickname && <div style={{ fontStyle: "italic", fontSize: "12px", opacity: 0.85 }}>&quot;{t.nickname}&quot;</div>}
          </div>
        </div>
      </div>

      {/* OP post */}
      <PostBox
        postNum={1}
        author="OP"
        date={t.created_at}
        content={t.description || "(No description provided.)"}
        isOP
      />

      {/* Reply posts */}
      {comments.map((c, i) => (
        <PostBox
          key={c.id}
          postNum={i + 2}
          author={c.author || "Anonymous"}
          date={c.created_at}
          content={c.content}
        />
      ))}

      {/* Reply form */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar"><span>📝 Post a Reply</span></div>
        <div style={{ padding: "10px" }}>
          {error && (
            <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px", marginBottom: "8px" }}>
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handlePost} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Your Name (optional)</label>
              <input
                className="win-input"
                placeholder="Anonymous"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                style={{ width: "200px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Reply *</label>
              <textarea
                className="win-input"
                rows={5}
                style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                placeholder="Type your reply here..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <button type="submit" className="win-btn win-btn-primary" disabled={posting}>
                {posting ? "Posting…" : "[ Post Reply ]"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PostBox({ postNum, author, date, content, isOP }) {
  const formattedDate = date ? new Date(date).toLocaleString() : "";
  return (
    <div className="win-panel" style={{ padding: 0 }}>
      {/* Post header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        minHeight: "80px",
        borderTop: postNum > 1 ? "2px solid #808080" : undefined,
      }}>
        {/* Left: user info */}
        <div style={{
          borderRight: "2px solid #808080",
          padding: "8px",
          background: isOP ? "#000080" : "#808080",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "10px",
        }}>
          {/* Avatar */}
          <div style={{
            width: "44px", height: "44px", background: "#C0C0C0",
            border: "2px outset #fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "22px",
          }}>
            {isOP ? "👤" : "💬"}
          </div>
          <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", wordBreak: "break-all" }}>
            {author}
          </div>
          {isOP && (
            <div style={{ fontSize: "10px", background: "#FFD700", color: "#000", padding: "1px 4px", fontWeight: "bold" }}>
              OP
            </div>
          )}
        </div>

        {/* Right: post content */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Post meta bar */}
          <div style={{
            background: "#000080", color: "#fff",
            display: "flex", justifyContent: "space-between",
            padding: "2px 8px", fontSize: "11px",
          }}>
            <span>Post #{postNum}</span>
            <span>{formattedDate}</span>
          </div>
          {/* Content */}
          <div style={{
            padding: "8px 10px", fontSize: "12px", lineHeight: "1.6",
            whiteSpace: "pre-wrap", flex: 1,
          }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
