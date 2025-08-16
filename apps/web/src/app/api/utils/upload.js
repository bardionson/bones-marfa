import { secureFetch, sanitizeInput } from "./security.js";

async function upload({ url, buffer, base64 }) {
  // Sanitize string inputs
  if (url && typeof url === "string") {
    url = sanitizeInput(url);
  }
  if (base64 && typeof base64 === "string") {
    base64 = sanitizeInput(base64);
  }

  const response = await secureFetch(`https://api.create.xyz/v0/upload`, {
    method: "POST",
    headers: {
      "Content-Type": buffer ? "application/octet-stream" : "application/json",
    },
    body: buffer ? buffer : JSON.stringify({ base64, url }),
  });
  const data = await response.json();
  return {
    url: data.url,
    mimeType: data.mimeType || null,
  };
}
export { upload };
export default upload;
