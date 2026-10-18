import { router } from "expo-router";
import { contaDaGuardare } from "@/lib/cassetto/scadenze";
import { RigaMenu } from "~/components/ui";
import { useScadenzeDocumenti } from "~/lib/cassetto";
import { oggiLocale } from "~/lib/stato";

/** La riga che apre il cassetto dei documenti, con quanti documenti sono scaduti o scadono presto. */
export function RigaCassetto() {
  const daGuardare = contaDaGuardare(useScadenzeDocumenti(), oggiLocale());
  return (
    <RigaMenu
      titolo="Cassetto dei documenti"
      sottotitolo={
        daGuardare > 0
          ? daGuardare === 1
            ? "1 documento da guardare: scade presto o è scaduto"
            : `${daGuardare} documenti da guardare: scadono presto o sono scaduti`
          : "AVS, IVA, polizze, permesso: con le scadenze"
      }
      icona="file-tray-full-outline"
      onPress={() => router.push("/documenti")}
    />
  );
}
