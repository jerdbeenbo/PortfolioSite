/* tslint:disable */
/* eslint-disable */
/**
 * Init function
 */
export function wasm_bridge_init(): void;
export function add_sand(row: number, col: number): void;
/**
 * Web Assembly wrapping layer
 * Essentially this is what the javascript layer will call every animation frame to keep the simulation going
 */
export function wasm_bridge_update(): any;
export class ParticleGrid {
  private constructor();
  free(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_particlegrid_free: (a: number, b: number) => void;
  readonly wasm_bridge_init: () => void;
  readonly add_sand: (a: number, b: number) => [number, number];
  readonly wasm_bridge_update: () => [number, number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
