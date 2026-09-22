import { cn } from "@/lib/utils"

/** The "Yumero" text logo in the Lobster font; replaces the old image logo everywhere. */
/* `leading-none` + a tiny downward nudge: Lobster's glyphs sit high in their line box, so this keeps the word optically centred next to buttons and inputs. */
const Wordmark = ({ className }: { className?: string }) => (
  <h1 className={cn("inline-block mb-1 font-logo leading-none whitespace-nowrap text-white select-none", className)}>Yumero</h1>
)

export default Wordmark
