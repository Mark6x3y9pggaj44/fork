import { useEffect, useRef, useState } from "react";

interface ContainerProps {
  name: string;
}

import { LemmyHttp, PostView } from "lemmy-js-client";
import Post from "./Post";
import { Virtuoso } from "react-virtuoso";
import { useAppDispatch, useAppSelector } from "../store";
import { receivedPosts } from "../features/post/postSlice";
import {
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import { LIMIT, client } from "../services/lemmy";
import { CenteredSpinner } from "./PostDetail";

interface PostsProps {
  communityName?: string;
}

export default function Posts({ communityName }: PostsProps) {
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState<PostView[]>([]);
  const loading = useRef(false);
  const [isListAtTop, setIsListAtTop] = useState<boolean>(true);
  const jwt = useAppSelector((state) => state.auth.jwt);
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchMore();
  }, []);

  async function fetchMore(refresh = false) {
    if (loading.current) return;
    loading.current = true;

    const currentPage = refresh ? 1 : page + 1;

    let posts: PostView[];

    try {
      ({ posts } = await client.getPosts({
        limit: LIMIT,
        page: currentPage,
        community_name: communityName,
        auth: jwt,
      }));

      // posts = posts.filter((post) => post.post.thumbnail_url && post.post.url); // testing
    } finally {
      loading.current = false;
    }

    if (refresh) {
      setPosts(posts);
    } else {
      setPosts((existingPosts) => {
        const result = [...existingPosts];
        result.splice(currentPage * LIMIT, LIMIT, ...posts);
        return result;
      });
    }

    setPage(currentPage);
    dispatch(receivedPosts(posts));
  }

  async function handleRefresh(event: RefresherCustomEvent) {
    try {
      await fetchMore(true);
    } finally {
      event.detail.complete();
    }
  }

  if (loading && !posts.length) return <CenteredSpinner />;

  return (
    <>
      <IonRefresher
        slot="fixed"
        onIonRefresh={handleRefresh}
        disabled={!isListAtTop}
      >
        <IonRefresherContent />
      </IonRefresher>
      <Virtuoso
        style={{ height: "100%" }}
        atTopStateChange={setIsListAtTop}
        totalCount={posts.length}
        itemContent={(index) => (
          <Post post={posts[index]} communityMode={!!communityName} />
        )}
        endReached={() => {
          fetchMore();
        }}
        increaseViewportBy={800}
      />
    </>
  );
}