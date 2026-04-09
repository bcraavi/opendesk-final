export type EditorType = "google-docs" | null;

export function detectEditor(): EditorType {
  if (
    window.location.hostname === "docs.google.com" &&
    window.location.pathname.startsWith("/document/")
  ) {
    return "google-docs";
  }
  return null;
}
