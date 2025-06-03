/* tslint:disable */
/* eslint-disable */
/**
 * The Flock struct is a collection of Vec<Boid> associated with a flockid
 */
export class Flock {
  free(): void;
  constructor(amt: number, width: number, height: number);
  get_velocities(): Float32Array;
  update_with_delta(delta_time: number): void;
  get_positions(): Float32Array;
  resize(new_width: number, new_height: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_flock_free: (a: number, b: number) => void;
  readonly flock_new: (a: number, b: number, c: number) => number;
  readonly flock_get_velocities: (a: number) => [number, number];
  readonly flock_update_with_delta: (a: number, b: number) => void;
  readonly flock_get_positions: (a: number) => [number, number];
  readonly flock_resize: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
