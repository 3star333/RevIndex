import { useState, useEffect, useRef } from "react";
import API_URL from "../api/config";

export default function PhotoGallery({ vehicleId }) {
  const [photos, setPhotos]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption]   = useState("");
  const [lightbox, setLightbox] = useState(null); // index
  const [error, setError]       = useState("");
  const fileRef                 = useRef();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPhotos(); }, [vehicleId]);

  async function fetchPhotos() {
    try {
      const res  = await fetch(`${API_URL}/vehicles/${vehicleId}/photos`);
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load photos."); }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption);
    setUploading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/vehicles/${vehicleId}/photos`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(prev => [...prev, data]);
      setCaption("");
    } catch (err) { setError(err.message); }
    finally { setUploading(false); fileRef.current.value = ""; }
  }

  async function handleDelete(photoId) {
    try {
      await fetch(`${API_URL}/vehicles/${vehicleId}/photos/${photoId}`, { method: "DELETE" });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (lightbox !== null) setLightbox(null);
    } catch { setError("Failed to delete photo."); }
  }

  return (
    <div className="win-panel" style={{ padding: 0 }}>
      <div className="win-title-bar">
        <span>📷</span>
        <span>Photo Gallery ({photos.length} photos)</span>
      </div>
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* Upload strip */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <input
            className="win-input"
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ flex: 1, minWidth: "120px" }}
          />
          <button
            className="win-btn"
            onClick={() => !uploading && fileRef.current.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "[ + Add Photo ]"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#FF0000", color: "#fff", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>
            ⚠ {error}
          </div>
        )}

        {/* Thumbnail grid */}
        {photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px", color: "#808080", fontSize: "12px" }}>
            No photos yet. Add one above!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "4px" }}>
            {photos.map((p, i) => (
              <div
                key={p.id}
                className="win-outset"
                style={{ position: "relative", cursor: "pointer", background: "#000", height: "80px", overflow: "hidden" }}
                onClick={() => setLightbox(i)}
              >
                <img
                  src={`${API_URL}${p.path}`}
                  alt={p.caption || "Photo"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px"
          }}
          onClick={() => setLightbox(null)}
        >
          <div className="win-panel" style={{ padding: 0, maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
              <span>📷 {photos[lightbox].caption || `Photo ${lightbox + 1} of ${photos.length}`}</span>
              <div style={{ display: "flex", gap: "2px" }}>
                <button className="win-btn" style={{ minWidth: "auto", padding: "0 6px", fontSize: "11px" }}
                  onClick={() => setLightbox(i => Math.max(0, i - 1))} disabled={lightbox === 0}>◄</button>
                <button className="win-btn" style={{ minWidth: "auto", padding: "0 6px", fontSize: "11px" }}
                  onClick={() => setLightbox(i => Math.min(photos.length - 1, i + 1))} disabled={lightbox === photos.length - 1}>►</button>
                <button className="win-btn" style={{ minWidth: "auto", padding: "0 6px", fontSize: "11px", color: "#FF0000", fontWeight: "bold" }}
                  onClick={() => handleDelete(photos[lightbox].id)}>Del</button>
                <button className="win-btn" style={{ minWidth: "auto", padding: "0 6px", fontSize: "11px" }}
                  onClick={() => setLightbox(null)}>✕</button>
              </div>
            </div>
            <div style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
              <img
                src={`${API_URL}${photos[lightbox].path}`}
                alt={photos[lightbox].caption || ""}
                style={{ maxWidth: "80vw", maxHeight: "75vh", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
