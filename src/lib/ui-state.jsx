import { createContext, useContext } from "react";
export const UICtx = createContext(null);
/** open(type, payload) shows a sheet; toast(msg, undo?) shows a toast. */
export const useUI = () => useContext(UICtx);
