import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/** Turns an HTML string into a PDF and opens the share menu with it attached. */
export async function sharePdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Share check-in report",
  });
}
