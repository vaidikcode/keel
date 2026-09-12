/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as assetDetails from "../assetDetails.js";
import type * as experienceValidators from "../experienceValidators.js";
import type * as kv from "../kv.js";
import type * as marketValidators from "../marketValidators.js";
import type * as notes from "../notes.js";
import type * as profiles from "../profiles.js";
import type * as snapshots from "../snapshots.js";
import type * as thoughts from "../thoughts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  assetDetails: typeof assetDetails;
  experienceValidators: typeof experienceValidators;
  kv: typeof kv;
  marketValidators: typeof marketValidators;
  notes: typeof notes;
  profiles: typeof profiles;
  snapshots: typeof snapshots;
  thoughts: typeof thoughts;
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
