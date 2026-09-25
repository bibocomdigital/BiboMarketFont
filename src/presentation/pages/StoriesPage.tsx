"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { listStories, type StoryItem } from "@/services/badgeService";
import { reportStory } from "@/services/platformService";

function label(story: StoryItem): string {
  return (
    story.author.shop?.name ||
    `${story.author.firstName || ""} ${story.author.lastName || ""}`.trim() ||
    "Compte"
  );
}

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    listStories()
      .then((rows) => {
        setStories(rows);
        setActiveId(rows[0]?.id ?? null);
      })
      .catch((err) => setError(getUserErrorMessage(err)));
  }, []);

  const active = stories.find((story) => story.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-bibocom-light pt-20 md:pt-24">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-bibocom-primary">Stories</h1>
        <p className="mt-2 text-sm text-slate-600">
          Photos et vidéos de 30 secondes, publiées par les comptes qui ont le badge.
        </p>
        {error ? <p className="mt-6 text-sm text-bibocom-error">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-bibocom-primary">{notice}</p> : null}
        {!error && stories.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Aucune story en ce moment.</p>
        ) : null}
        {stories.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
            <ul className="flex gap-3 overflow-x-auto md:block md:space-y-2">
              {stories.map((story) => (
                <li key={story.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(story.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${
                      story.id === activeId ? "bg-bibocom-primary text-white" : "bg-white text-bibocom-primary"
                    }`}
                  >
                    <span className="truncate text-sm font-medium">{label(story)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {active ? (
              <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {active.mediaType === "VIDEO" ? (
                  <video src={active.mediaUrl} className="max-h-[70vh] w-full bg-black" controls autoPlay />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.mediaUrl} alt="" className="max-h-[70vh] w-full object-contain bg-bibocom-primary/5" />
                )}
                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="font-medium text-bibocom-primary">{label(active)}</p>
                  <div className="flex items-center gap-3">
                    {active.author.shop ? (
                      <Link to={`/boutique/${active.author.shop.id}`} className="text-sm text-bibocom-accent">
                        Voir la boutique
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="text-sm text-slate-500"
                      onClick={() => {
                        const reason = window.prompt("Pourquoi signalez-vous cette story ?");
                        if (!reason || reason.trim().length < 2) return;
                        reportStory(active.id, reason.trim())
                          .then(() => setNotice("Signalement envoyé."))
                          .catch((err) => setNotice(getUserErrorMessage(err)));
                      }}
                    >
                      Signaler
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
