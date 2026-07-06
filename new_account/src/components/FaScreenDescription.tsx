import React from "react";
import ModuleScreenDescription from "./ModuleScreenDescription";
import type { ScreenCopy } from "../utils/moduleHubCopy";
import { FA_SCREEN_COPY, type FaScreenKey } from "../utils/fixedAssetsScreenCopy";

type Props = {
  screen: FaScreenKey;
};

/** Info panel at top of Fixed Assets transaction / inquiry screens */
export default function FaScreenDescription({ screen }: Props) {
  const copy: ScreenCopy | undefined = FA_SCREEN_COPY[screen];
  return <ModuleScreenDescription copy={copy} />;
}
