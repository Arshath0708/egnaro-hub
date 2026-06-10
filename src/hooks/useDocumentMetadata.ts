import { useEffect } from "react";

/**
 * Custom hook to dynamically manage page title and meta description for SEO.
 * Automatically restores previous metadata values on component unmount.
 */
export function useDocumentMetadata(title: string, description?: string) {
  useEffect(() => {
    const originalTitle = document.title;
    // Prevent double appending if "Egnaro Mart" is already in the title string
    const finalTitle = title.includes("Egnaro Mart") ? title : `${title} | Egnaro Mart`;
    document.title = finalTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    let originalDesc = "";
    if (metaDesc) {
      originalDesc = metaDesc.getAttribute("content") || "";
      if (description) {
        metaDesc.setAttribute("content", description);
      }
    }

    return () => {
      if (document.title === finalTitle) {
        document.title = originalTitle;
      }
      if (metaDesc && originalDesc && metaDesc.getAttribute("content") === description) {
        metaDesc.setAttribute("content", originalDesc);
      }
    };
  }, [title, description]);
}
