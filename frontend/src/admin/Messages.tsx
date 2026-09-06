import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Message = {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.get<Message[]>("/contact-messages");
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/contact-messages/${id}`, { status });

      setMessages((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to update message");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      await api.del(`/contact-messages/${id}`);

      setMessages((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete message");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
              HYA JAKLAIR / ADMIN
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Messages
            </h1>

            <p className="mt-2 text-gray-500">
              Messages received from your website contact form.
            </p>
          </div>

          <button
            onClick={loadMessages}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-gray-500">
            Loading messages...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-16 text-center">
            <div className="mb-4 text-5xl">✉</div>

            <h2 className="text-2xl font-semibold">
              No messages yet
            </h2>

            <p className="mt-2 text-gray-500">
              Messages submitted through your contact form will appear here.
            </p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {item.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "new"
                            ? "bg-amber-500/15 text-amber-400"
                            : item.status === "read"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-green-500/15 text-green-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      {item.contact}
                    </p>

                    <p className="mt-5 whitespace-pre-wrap leading-7 text-gray-200">
                      {item.message}
                    </p>

                    <p className="mt-5 text-xs text-gray-600">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(item.id, "read")}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Mark read
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "replied")}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Replied
                    </button>

                    <button
                      onClick={() => deleteMessage(item.id)}
                      className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}