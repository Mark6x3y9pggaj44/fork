import { useEffect, useMemo, useState } from "react";
import { LIMIT, getClient } from "../services/lemmy";
import { CommentNodeI, buildCommentsTree } from "../helpers/lemmy";
import CommentTree from "./CommentTree";
import {
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  useIonToast,
} from "@ionic/react";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { CommentView, Person } from "lemmy-js-client";
import { pullAllBy, uniqBy } from "lodash";
import { useLocation } from "react-router";
import { Virtuoso } from "react-virtuoso";
import { useAppDispatch, useAppSelector } from "../store";
import { receivedComments } from "../features/comment/commentSlice";
import { RefresherCustomEvent } from "@ionic/core";
import { getPost } from "../features/post/postSlice";

const centerCss = css`
  position: relative;
  margin: 4rem 0 4rem;
  left: 50%;
  transform: translateX(-50%);
`;

const StyledIonSpinner = styled(IonSpinner)`
  ${centerCss}
  opacity: 0.7;
`;

const Empty = styled.div`
  ${centerCss}

  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;

  aside {
    color: var(--ion-color-medium);
    font-size: 0.8em;
  }
`;

interface CommentsProps {
  header: React.ReactNode;
  postId: number;
  op: Person;
}

export default function Comments({ header, postId, op }: CommentsProps) {
  const dispatch = useAppDispatch();
  const jwt = useAppSelector((state) => state.auth.jwt);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finishedPaging, setFinishedPaging] = useState(false);
  const [comments, setComments] = useState<CommentView[]>([]);
  const commentTree = useMemo(
    () => buildCommentsTree(comments, false),
    [comments]
  );
  const [isListAtTop, setIsListAtTop] = useState<boolean>(true);
  const { pathname } = useLocation();
  const [present] = useIonToast();

  async function fetchComments(refresh = false) {
    if (refresh) {
      setLoading(false);
      setFinishedPaging(false);
      setPage(0);
    }

    let response;

    if (loading) return;
    if (finishedPaging) return;

    const currentPage = page + 1;

    const reqPostId = postId;
    setLoading(true);

    try {
      response = await getClient(pathname).getComments({
        post_id: reqPostId,
        limit: 10,
        sort: "Hot",
        type_: "All",
        max_depth: 8,
        saved_only: false,
        page: currentPage,
        auth: jwt,
      });
    } catch (error) {
      if (reqPostId === postId)
        present({
          message: "Problem fetching comments. Please try again.",
          duration: 3500,
          position: "bottom",
          color: "danger",
        });

      throw error;
    } finally {
      setLoading(false);
    }

    dispatch(receivedComments(response.comments));

    if (reqPostId !== postId) return;

    const existingComments = refresh ? [] : comments;
    const newComments = pullAllBy(
      response.comments,
      existingComments,
      "comment.id"
    );
    if (!newComments.length) setFinishedPaging(true);
    setComments(uniqBy([...comments, ...newComments], (c) => c.comment.id));
    setPage(currentPage);
  }

  async function handleRefresh(event: RefresherCustomEvent) {
    try {
      await Promise.all([fetchComments(true), dispatch(getPost(postId))]);
    } finally {
      event.detail.complete();
    }
  }

  useEffect(() => {
    fetchComments(true);
  }, [postId]);

  const allComments = (() => {
    if (loading && !comments.length) return [<StyledIonSpinner />];

    if (!comments.length)
      return [
        <Empty>
          <div>No Comments</div>
          <aside>It's quiet... too quiet...</aside>
        </Empty>,
      ];

    return commentTree.map((comment, index) => (
      <CommentTree
        comment={comment}
        key={comment.comment_view.comment.id}
        first={index === 0}
        op={op}
      />
    ));
  })();

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
        totalCount={allComments.length + 1}
        itemContent={(index) => (index ? allComments[index - 1] : header)}
        endReached={() => fetchComments()}
        atTopStateChange={setIsListAtTop}
      />
    </>
  );
}