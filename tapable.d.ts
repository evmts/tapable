type FixedSizeArray<T extends number, U> = T extends 0
  ? void[]
  : ReadonlyArray<U> & {
      0: U
      length: T
    }
type Measure<T extends number> = T extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  ? T
  : never
type Append<T extends any[], U> = {
  0: [U]
  1: [T[0], U]
  2: [T[0], T[1], U]
  3: [T[0], T[1], T[2], U]
  4: [T[0], T[1], T[2], T[3], U]
  5: [T[0], T[1], T[2], T[3], T[4], U]
  6: [T[0], T[1], T[2], T[3], T[4], T[5], U]
  7: [T[0], T[1], T[2], T[3], T[4], T[5], T[6], U]
  8: [T[0], T[1], T[2], T[3], T[4], T[5], T[6], T[7], U]
}[Measure<T['length']>]
type AsArray<T> = T extends any[] ? T : [T]

declare class UnsetAdditionalOptions {
  _UnsetAdditionalOptions: true
}
type IfSet<X> = X extends UnsetAdditionalOptions ? {} : X

type Callback<E, T> = (error: E | null, result?: T) => void
type InnerCallback<E, T> = (error?: E | null | false, result?: T) => void

type FullTap = Tap & {
  type: 'sync' | 'async' | 'promise'
  fn: Function
}

type Tap = TapOptions & {
  name: string
}

type TapOptions = {
  before?: string
  stage?: number
}

interface HookInterceptor<T, R, AdditionalOptions = UnsetAdditionalOptions> {
  name?: string
  tap?: (tap: FullTap & IfSet<AdditionalOptions>) => void
  call?: (...args: any[]) => void
  loop?: (...args: any[]) => void
  error?: (err: Error) => void
  result?: (result: R) => void
  done?: () => void
  register?: (
    tap: FullTap & IfSet<AdditionalOptions>,
  ) => FullTap & IfSet<AdditionalOptions>
}

type ArgumentNames<T extends any[]> = FixedSizeArray<T['length'], string>

declare class Hook<T, R, AdditionalOptions = UnsetAdditionalOptions> {
  constructor(args?: ArgumentNames<AsArray<T>>, name?: string)
  name: string | undefined
  taps: FullTap[]
  intercept(interceptor: HookInterceptor<T, R, AdditionalOptions>): void
  isUsed(): boolean
  callAsync(...args: Append<AsArray<T>, Callback<Error, R>>): void
  promise(...args: AsArray<T>): Promise<R>
  tap(
    options: string | (Tap & IfSet<AdditionalOptions>),
    fn: (...args: AsArray<T>) => R,
  ): void
  withOptions(
    options: TapOptions & IfSet<AdditionalOptions>,
  ): Omit<this, 'call' | 'callAsync' | 'promise'>
}

export class SyncHook<
  T,
  R = void,
  AdditionalOptions = UnsetAdditionalOptions,
> extends Hook<T, R, AdditionalOptions> {
  call(...args: AsArray<T>): R
}

export class SyncBailHook<
  T,
  R,
  AdditionalOptions = UnsetAdditionalOptions,
> extends SyncHook<T, R, AdditionalOptions> {}
export class SyncLoopHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends SyncHook<T, void, AdditionalOptions> {}
export class SyncWaterfallHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends SyncHook<T, AsArray<T>[0], AdditionalOptions> {}

declare class AsyncHook<
  T,
  R,
  AdditionalOptions = UnsetAdditionalOptions,
> extends Hook<T, R, AdditionalOptions> {
  tapAsync(
    options: string | (Tap & IfSet<AdditionalOptions>),
    fn: (...args: Append<AsArray<T>, InnerCallback<Error, R>>) => void,
  ): void
  tapPromise(
    options: string | (Tap & IfSet<AdditionalOptions>),
    fn: (...args: AsArray<T>) => Promise<R>,
  ): void
}

export class AsyncParallelHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, void, AdditionalOptions> {}
export class AsyncParallelBailHook<
  T,
  R,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, R, AdditionalOptions> {}
export class AsyncSeriesHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, void, AdditionalOptions> {}
export class AsyncSeriesBailHook<
  T,
  R,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, R, AdditionalOptions> {}
export class AsyncSeriesLoopHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, void, AdditionalOptions> {}
export class AsyncSeriesWaterfallHook<
  T,
  AdditionalOptions = UnsetAdditionalOptions,
> extends AsyncHook<T, AsArray<T>[0], AdditionalOptions> {}

type HookFactory<H> = (key: any, hook?: H) => H

interface HookMapInterceptor<H> {
  factory?: HookFactory<H>
}

export class HookMap<H> {
  constructor(factory: HookFactory<H>, name?: string)
  name: string | undefined
  get(key: any): H | undefined
  for(key: any): H
  intercept(interceptor: HookMapInterceptor<H>): void
}

export class MultiHook<H> {
  constructor(hooks: H[], name?: string)
  name: string | undefined
  tap(options: string | Tap, fn?: Function): void
  tapAsync(options: string | Tap, fn?: Function): void
  tapPromise(options: string | Tap, fn?: Function): void
}

import * as util from 'util'

const deprecateContext = util.deprecate(
  () => {},
  'Hook.context is deprecated and will be removed',
)

type CallDelegate = (...args: any[]) => any

const CALL_DELEGATE: CallDelegate = function (this: Hook, ...args: any[]) {
  this.call = this._createCall('sync')
  return this.call(...args)
}

const CALL_ASYNC_DELEGATE: CallDelegate = function (
  this: Hook,
  ...args: any[]
) {
  this.callAsync = this._createCall('async')
  return this.callAsync(...args)
}

const PROMISE_DELEGATE: CallDelegate = function (this: Hook, ...args: any[]) {
  this.promise = this._createCall('promise')
  return this.promise(...args)
}

interface TapOptions {
  name?: string
  before?: string | string[]
  stage?: number
  type?: string
  fn?: Function
  context?: any
}

interface Interceptor {
  register?: (options: TapOptions) => TapOptions
}

class Hook {
  private _args: any[]
  public name?: string;
  public taps: TapOptions[] = [];
  public interceptors: Interceptor[] = [];
  private _call: CallDelegate = CALL_DELEGATE;
  public call: CallDelegate = CALL_DELEGATE;
  private _callAsync: CallDelegate = CALL_ASYNC_DELEGATE;
  public callAsync: CallDelegate = CALL_ASYNC_DELEGATE;
  private _promise: CallDelegate = PROMISE_DELEGATE;
  public promise: CallDelegate = PROMISE_DELEGATE;
  private _x?: any;

  constructor(args: any[] = [], name?: string) {
    this._args = args;
    this.name = name;
    this.compile = this.compile;
    this.tap = this.tap;
    this.tapAsync = this.tapAsync;
    this.tapPromise = this.tapPromise;
  }

  compile(options: {
    taps: TapOptions[];
    interceptors: Interceptor[];
    args: any[];
    type: string;
  }): never {
    throw new Error('Abstract: should be overridden');
  }

  private _createCall(type: string) {
    return this.compile({
      taps: this.taps,
      interceptors: this.interceptors,
      args: this._args,
      type: type,
    });
  }

  private _tap(type: string, options: string | TapOptions, fn: Function) {
    let _options: TapOptions = typeof options === 'string' ? { name: options.trim() } : options;

    if (!_options || typeof _options !== 'object' || _options === null) {
      throw new Error('Invalid tap options');
    }
    if (!_options.name || _options.name === '') {
      throw new Error('Missing name for tap');
    }
    if (_options.context !== undefined) {
      deprecateContext();
    }
    _options = { ..._options, type, fn };
    _options = this._runRegisterInterceptors(_options);
    this._insert(_options);
  }

  tap(options: string | TapOptions, fn: Function) {
    this._tap('sync', options, fn);
  }

  tapAsync(options: string | TapOptions, fn: Function) {
    this._tap('async', options, fn);
  }

  tapPromise(options: string | TapOptions, fn: Function) {
    this._tap('promise', options, fn);
  }

  private _runRegisterInterceptors(options: TapOptions): TapOptions {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        const newOptions = interceptor.register(options);
        if (newOptions !== undefined) {
          options = newOptions;
        }
      }
    }
    return options;
  }

  withOptions(options: TapOptions) {
    const mergeOptions = (opt: string | TapOptions) =>
      typeof opt === 'string' ? { ...options, name: opt } : { ...options, ...opt };

    return {
      name: this.name,
      tap: (opt: string | TapOptions, fn: Function) => this.tap(mergeOptions(opt), fn),
      tapAsync: (opt: string | TapOptions, fn: Function) => this.tapAsync(mergeOptions(opt), fn),
      tapPromise: (opt: string | TapOptions, fn: Function) => this.tapPromise(mergeOptions(opt), fn),
      intercept: (interceptor: Interceptor) => this.intercept(interceptor),
      isUsed: () => this.isUsed(),
      withOptions: (opt: string | TapOptions) => this.withOptions(mergeOptions(opt)),
    };
  }

  isUsed() {
    return this.taps.length > 0 || this.interceptors.length > 0;
  }

  intercept(interceptor: Interceptor) {
    this._resetCompilation();
    this.interceptors.push({ ...interceptor });
    if (interceptor.register) {
      for (let i = 0; i < this.taps.length; i++) {
        this.taps[i] = interceptor.register(this.taps[i])!;
      }
    }
  }

  private _resetCompilation() {
    this.call = this._call;
    this.callAsync = this._callAsync;
    this.promise = this._promise;
  }

  private _insert(item: TapOptions) {
    this._resetCompilation();
    let before: Set<string> | undefined;

    if (typeof item.before === 'string') {
      before = new Set([item.before]);
    } else if (Array.isArray(item.before)) {
      before = new Set(item.before);
    }

    const stage = item.stage || 0;
    let i = this.taps.length;

    while (i > 0) {
      i--;
      const x = this.taps[i];
      this.taps[i + 1] = x;

      const xStage = x.stage || 0;

      if (before?.has(x.name!)) {
        before.delete(x.name!);
        continue;
      }

      if (before && before.size > 0) {
        continue;
      }

      if (xStage > stage) {
        continue;
      }

      i++;
      break;
    }

    this.taps[i] = item;
  }
}

Object.setPrototypeOf(Hook.prototype, null)

export default Hook
