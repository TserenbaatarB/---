"use client";

export default function CopyLinkButton() {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      alert("Урилгын линк хууллаа ✓");
    } catch {
      alert("Линк хуулах боломжгүй байна.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold shadow-sm"
    >
      🔗 Урилгын линк хуулах
    </button>
  );
}