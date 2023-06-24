import styled from "@emotion/styled";
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonSearchbar,
  IonTitle,
} from "@ionic/react";
import { caretDown, chevronDown } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { getClient } from "../services/lemmy";
import { CommunityView } from "lemmy-js-client";

const TitleContents = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledIonSearch = styled(IonSearchbar)`
  max-width: 300px;
  margin: auto;

  && {
    padding-top: 0;
    padding-bottom: 0;
  }

  .searchbar-search-icon {
    display: none;
    width: 0;
    height: 0;
  }

  --background: none;
`;

interface TitleSearchProps {
  community: string;
  children: React.ReactNode;
}

export default function TitleSearch({ community, children }: TitleSearchProps) {
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const [searching, setSearching] = useState(false);
  const [value, setValue] = useState("");
  const [searchPayload, setSearchPayload] = useState<CommunityView[]>([]);

  useEffect(() => {
    if (!searching) return;

    setTimeout(() => {
      searchRef.current?.getInputElement().then((e) => e.focus());
    }, 100);
  }, [searching]);

  useEffect(() => {
    if (!value) {
      setSearchPayload([]);
      return;
    }

    search();
  }, [value]);

  async function search() {
    const result = await getClient(location.pathname).search({
      q: value,
      limit: 20,
      type_: "Communities",
    });

    setSearchPayload(result.communities);
  }

  if (searching) {
    return (
      <>
        <IonTitle>
          <StyledIonSearch
            ref={searchRef}
            placeholder="Community..."
            showCancelButton="never"
            showClearButton="never"
            onIonChange={(e) => setValue(e.target.value || "")}
            debounce={500}
          />
        </IonTitle>

        <IonButtons slot="end">
          <IonButton onClick={() => setSearching(false)}>Cancel</IonButton>
        </IonButtons>
      </>
    );
  }
  return (
    <>
      <IonTitle>
        <TitleContents onClick={() => setSearching(true)}>
          {community} <IonIcon icon={chevronDown} />
        </TitleContents>
      </IonTitle>
      {children}
    </>
  );
}
