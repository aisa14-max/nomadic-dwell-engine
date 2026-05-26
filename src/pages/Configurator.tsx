import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Box, RotateCw, ZoomIn, ZoomOut, ArrowRight, Send } from "lucide-react";
import BlurText from "@/components/BlurText";
import ClaimSpotScene from "@/components/ClaimSpotScene";
import dwelling from "@/assets/skye-moor.jpg";
import ReservationCustomizer from "@/components/worlds/ReservationCustomizer";

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function Configurator() {
  const [showNext, setShowNext] = useState(false);

  // Engine Assistant chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = ["Change layout", "Add more working space", "Add privacy features"];

  useEffect(() => {
    const t = setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi, I'm your Engine Assistant 👋 Do you want to make any changes to your Nomadic Engine?",
        },
      ]);
      setShowSuggestions(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    const userMsg: ChatMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsStreaming(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engine-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Rate limit reached. Try again shortly.");
        if (resp.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
        throw new Error("Assistant unavailable.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      let acc = "";

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: acc };
                return next;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <ClaimSpotScene className="fixed inset-0 w-full h-full z-0" />
      <div className="fixed inset-0 z-0 bg-black/55" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-body text-white/80 mb-4">// Worlds</p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-3xl">
              <BlurText
                text="Compose your engine."
                className="font-heading text-white text-5xl md:text-6xl lg:text-[5rem] leading-[0.9] tracking-[-3px]"
              />
            </div>
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="flex gap-3"
            >
              <button
                onClick={() => setShowNext(true)}
                className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2"
              >
                Continue configuration <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
            {/* VIEWPORT */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
              className="relative"
            >
              <div
                className="liquid-glass relative rounded-[1.25rem] overflow-hidden"
                style={{ height: "58vh" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="autorotate">
                    <img
                      src={dwelling}
                      alt="Modular dwelling render"
                      className="max-h-[50vh] max-w-[80%] object-contain drop-shadow-[0_30px_60px_rgba(255,255,255,0.08)]"
                    />
                  </div>
                </div>

                <div className="absolute top-4 right-4 liquid-glass rounded-full flex flex-col gap-1 p-1.5">
                  {[Box, RotateCw, ZoomIn, ZoomOut].map((I, i) => (
                    <button key={i} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white">
                      <I className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>

                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <span className="liquid-glass tag-glass">Site: Skye Moor</span>
                </div>
              </div>

              {/* Performance strip */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Assembly time" value="10" unit="hours" />
                <Stat label="Energy consumption" value="3.6" unit="kWh/d" />
                <Stat label="Total mass" value="0.63" unit="t" />
                <Stat label="Total area" value="25" unit="m²" />
              </div>
            </motion.div>

            {/* AI ASSIST — CHAT */}
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] p-5 flex flex-col"
              style={{ height: "calc(58vh + 96px)" }}
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
              </div>

              <div
                ref={scrollRef}
                className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3 text-sm font-body"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2 max-w-[88%] leading-relaxed ${
                        m.role === "user"
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/90 border border-white/10"
                      }`}
                    >
                      {m.content || (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse [animation-delay:120ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse [animation-delay:240ms]" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="mt-3 shrink-0 flex items-center gap-2 liquid-glass rounded-full pl-4 pr-1.5 py-1.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the Engine Assistant…"
                  disabled={isStreaming}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="bg-white text-black rounded-full w-9 h-9 inline-flex items-center justify-center disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </motion.aside>
          </div>
        </div>
      </div>

      {/* Reservation customizer — opens on Continue configuration */}
      <AnimatePresence>
        {showNext && <ReservationCustomizer onClose={() => setShowNext(false)} />}
      </AnimatePresence>
    </div>
  );
}


function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="liquid-glass rounded-[1rem] p-4 cursor-default border border-white/10 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.25)] transition-[background,border,box-shadow] duration-300"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-body">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-heading text-white text-3xl tracking-[-1px] leading-none">{value}</span>
        <span className="text-xs text-white/60 font-body">{unit}</span>
      </div>
    </motion.div>
  );
}
