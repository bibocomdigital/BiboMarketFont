"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { deleteStory, listModerationStories, setStoryStatus, type StoryItem } from "@/services/badgeService";
import { GhostButton, Panel, StateMessage } from "./ui";

function authorName(story: StoryItem): string {
  const shop = story.author.shop?.name;
  const person = `${story.author.firstName || ""} ${story.author.lastName || ""}`.trim();
  return shop || person || "Compte";
}

export function AdminStoriesView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    listModerationStories()
      .then((data) => setStories(data.stories))
      .catch((err) => setError(getUserErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (work: () => Promise<unknown>) => {
    try {
      await work();
      load();
    } catch (err) {
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
    }
  };

  if (loading) return <StateMessage>Chargement des stories…</StateMessage>;
  if (error) return <StateMessage>{error}</StateMessage>;
  if (stories.length === 0) return <StateMessage>Aucune story pour le moment.</StateMessage>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stories.map((story) => (
        <Panel key={story.id} className="overflow-hidden">
          {story.mediaType === "VIDEO" ? (
            <video src={story.mediaUrl} className="h-48 w-full bg-black object-cover" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.mediaUrl} alt="" className="h-48 w-full object-cover" />
          )}
          <div className="space-y-2 p-4">
            <p className="font-medium text-white">{authorName(story)}</p>
            <p className="text-xs text-white/50">
              {story.status === "PUBLISHED" ? "Publiée" : "Retirée"}
              {story.durationSeconds ? ` · ${story.durationSeconds}s` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {story.status === "PUBLISHED" ? (
                <GhostButton onClick={() => void act(() => setStoryStatus(story.id, "REJECTED"))}>
                  Retirer
                </GhostButton>
              ) : (
                <GhostButton onClick={() => void act(() => setStoryStatus(story.id, "PUBLISHED"))}>
                  Republier
                </GhostButton>
              )}
              <GhostButton onClick={() => void act(() => deleteStory(story.id))}>Supprimer</GhostButton>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
