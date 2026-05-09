/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as codeExecution from "../codeExecution.js";
import type * as codeExecutions from "../codeExecutions.js";
import type * as http from "../http.js";
import type * as repoAnalyzer from "../repoAnalyzer.js";
import type * as repoChat from "../repoChat.js";
import type * as repositories from "../repositories.js";
import type * as repositoryActions from "../repositoryActions.js";
import type * as snippets from "../snippets.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  codeExecution: typeof codeExecution;
  codeExecutions: typeof codeExecutions;
  http: typeof http;
  repoAnalyzer: typeof repoAnalyzer;
  repoChat: typeof repoChat;
  repositories: typeof repositories;
  repositoryActions: typeof repositoryActions;
  snippets: typeof snippets;
  stats: typeof stats;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
