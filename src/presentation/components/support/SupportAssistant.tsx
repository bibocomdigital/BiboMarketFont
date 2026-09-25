"use client";

import React, { useEffect, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { getAuthToken } from "@/services/configService";
import { askSupport, listMyTickets, type Ticket } from "@/services/platformService";

export function SupportAssistant() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const signedIn = typeof window !== "undefined" && !!getAuthToken();

  useEffect(() => {
    if (!signedIn) return;
    listMyTickets()
      .then((rows) => setTickets(Array.isArray(rows) ? rows : []))
      .catch(() => setTickets([]));
  }, [signedIn]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await askSupport(message.trim());
      setReply(result.reply);
      setMessage("");
      const rows = await listMyTickets();
      setTickets(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-xl font-semibold text-bibocom-primary">Assistant support</h2>
      <p className="mt-2 text-sm text-slate-600">
        Décrivez votre demande. Un ticket est ouvert et l’équipe Bibocom vous répond.
      </p>
      <form onSubmit={send} className="mt-4 space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          required
          placeholder="Votre message"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        {error ? <p className="text-sm text-bibocom-error">{error}</p> : null}
        {reply ? <p className="rounded-xl bg-bibocom-secondary/20 px-3 py-2 text-sm text-bibocom-primary">{reply}</p> : null}
        <button
          type="submit"
          disabled={pending || message.trim().length < 2}
          className="rounded-xl bg-bibocom-primary px-4 py-2 text-sm font-medium text-white"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
      </form>
      {tickets.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-xl bg-bibocom-light px-3 py-2 text-sm">
              <p className="font-medium text-bibocom-primary">
                #{ticket.id} · {ticket.status}
              </p>
              <p className="text-slate-600">{ticket.subject}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
