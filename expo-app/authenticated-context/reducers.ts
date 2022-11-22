import Constants from "expo-constants";
export const name = Constants.expoConfig?.name


// import type { PayloadAction } from "@reduxjs/toolkit";
// import { AUTHENTICATED, SSE_EVENT } from "./actions";
// import { JwtClaims } from "./JwtClaims";
// export const claims = (state = {}, action: PayloadAction<JwtClaims>) => {
//   if (action.type === AUTHENTICATED) {
//     return { ...state, claims: action.payload };
//   }
//   return state;
// };
// export const sseState = (state = [], action: PayloadAction<JwtClaims>) => {
//   if (action.type === SSE_EVENT) {
//     return [...state, action.payload].slice(-5);
//   }
//   return state;
// };
