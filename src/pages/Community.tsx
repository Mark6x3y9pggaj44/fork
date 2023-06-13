import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import Posts from "../components/Posts";
import "./Tab1.css";
import { useParams } from "react-router";
import AppBackButton from "../components/AppBackButton";

export default function Community() {
  const { actor, community } = useParams<{
    actor: string;
    community: string;
  }>();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton
              defaultText="Communities"
              defaultHref={`/${actor}`}
            />
          </IonButtons>

          <IonTitle>{community}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <Posts communityName={community} />
      </IonContent>
    </IonPage>
  );
}