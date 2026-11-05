import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

/** Salva um arquivo de texto: download no navegador, menu de compartilhar no app nativo. */
export async function saveTextFile(name, text, mime = "application/json") {
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: name, files: [res.uri] });
    } finally {
      // Remove a cópia temporária depois de compartilhar.
      setTimeout(() => Filesystem.deleteFile({ path: name, directory: Directory.Cache }).catch(() => {}), 60000);
    }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
