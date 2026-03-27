import { useState, useRef } from "react";
import API_URL from "../api/config";

export default function ImageUpload({ vehicleId, currentImage, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const fileRef                   = useRef();

  async function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("image", file);

    setUploading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/vehicles/${vehicleId}/image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUpload(data.image);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {/* Preview / upload zone */}
      <div
        className="win-inset"
        style={{
          width: "100%",
          height: "160px",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          cursor: uploading ? "wait" : "pointer",
        }}
        onClick={() => !uploading && fileRef.current.click()}
      >
        {currentImage ? (
          <>
            <img
              src={`${API_URL}${currentImage}`}
              alt="Vehicle"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Hover overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,128,0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
            >
              <span style={{ color: "#FFFF00", fontWeight: "bold", fontSize: "12px" }}>
                [ Change Photo ]
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#808080" }}>
            <div style={{ fontSize: "28px", marginBottom: "4px" }}>📷</div>
            <div style={{ fontSize: "12px" }}>Click to upload photo</div>
            <div style={{ marginTop: "6px" }}>
              <span
                className="win-btn"
                style={{ fontSize: "11px", padding: "2px 10px", minWidth: "auto", color: "#000", background: "#C0C0C0" }}
              >
                Browse...
              </span>
            </div>
          </div>
        )}

        {/* Uploading spinner */}
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ color: "#00FF00", fontFamily: "Courier New, monospace", fontSize: "12px", fontWeight: "bold" }}>
              Uploading...
            </div>
            <div style={{ color: "#FFFF00", fontSize: "18px" }} className="blink">⬛</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#ffffff", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
