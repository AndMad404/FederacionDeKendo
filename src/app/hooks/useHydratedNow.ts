import { useContext, useState, useSyncExternalStore } from "react";
import { PrerenderedAtContext } from "../config/PrerenderedAtContext";

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydratedNow(): Date | undefined {
  const prerenderedAt = useContext(PrerenderedAtContext);
  const hydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [now] = useState(() => new Date());

  return hydrated ? now : prerenderedAt ? new Date(prerenderedAt) : undefined;
}
