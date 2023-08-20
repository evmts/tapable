import * as util from 'util';

const deprecateContext = util.deprecate(
  () => {},
  'Hook.context is deprecated and will be removed',
);

type CallDelegate = (...args: any[]) => any;

const CALL_DELEGATE: CallDelegate = function(this: Hook, ...args: any[]) {
  this.call = this._createCall('sync');
  return this.call(...args);
};

const CALL_ASYNC_DELEGATE: CallDelegate = function(this: Hook, ...args: any[]) {
  this.callAsync = this._createCall('async');
  return this.callAsync(...args);
};

const PROMISE_DELEGATE: CallDelegate = function(this: Hook, ...args: any[]) {
  this.promise = this._createCall('promise');
  return this.promise(...args);
};

interface TapOptions {
  name?: string;
  before?: string | string[];
  stage?: number;
  type?: string;
  fn?: Function;
  context?: any;
}

interface Interceptor {
  register?: (options: TapOptions) => TapOptions;
}

class Hook {
  private _args: any[];
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

    let stage = item.stage || 0;
    let i = this.taps.length;

    while (i > 0) {
      i--;
      const x = this.taps[i];
      this.taps[i + 1] = x;

      const xStage = x.stage || 0;

      if (before && before.has(x.name!)) {
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

Object.setPrototypeOf(Hook.prototype, null);

export default Hook;
