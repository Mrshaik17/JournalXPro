import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail, MessageSquare, Clock3 } from "lucide-react";

export const ContactSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      toast.error("All fields are required");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: cleanName,
        email: cleanEmail,
        subject: "Website Contact",
        message: cleanMessage,
        status: "unread",
      });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-border">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-5">
            <MessageSquare className="h-3.5 w-3.5" />
            Support & Contact
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Need help? We’re here.
          </h2>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have a question about plans, payments, features, or your account?
            Send us a message and we’ll get back to you shortly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 md:p-8 shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
            <p className="text-sm text-muted-foreground leading-7 mb-6">
              Whether you’re a forex trader, crypto trader, or prop firm trader,
              our team is here to help you get started and solve issues quickly.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">
                    journalxpro@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-sm text-muted-foreground">
                    Usually within a short time during active support hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Best for</p>
                  <p className="text-sm text-muted-foreground">
                    Payments, feature questions, account help, and startup support.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 md:p-8 space-y-5 shadow-lg"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-background border-border h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Email *
                </label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="bg-background border-border h-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Message *
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help you..."
                className="bg-background border-border min-h-[140px]"
                rows={5}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/15"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};