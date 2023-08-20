/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
'use strict'

import AsyncSeriesBailHook from './AsyncSeriesBailHook'
import AsyncSeriesHook from './AsyncSeriesHook'
import AsyncSeriesLoopHook from './AsyncSeriesLoopHook'
import AsyncSeriesWaterfallHook from './AsyncSeriesWaterfallHook'
import HookTester from './HookTester'

describe('AsyncSeriesHook', () => {
  it('should not have call method', () => {
    const hook = new AsyncSeriesHook([])
    expect(hook.call).toEqual(undefined)
    expect(typeof hook.callAsync).toEqual('function')
    expect(typeof hook.promise).toEqual('function')
  })

  it('should have tap method', async () => {
    await new Promise((resolve) => {
    const hook = new AsyncSeriesHook([])
    const mockTap = vi.fn()
    hook.tap('somePlugin', mockTap)
    hook.callAsync(() => resolve())
    expect(mockTap).toHaveBeenCalledTimes(1)
    })
  })

  it('should have promise method', async () => {
    await new Promise((resolve) => {
    const hook = new AsyncSeriesHook([])
    const mockTap = vi.fn()
    hook.tap('somePlugin', mockTap)
    hook.promise().then(() => resolve())
    expect(mockTap).toHaveBeenCalledTimes(1)
    })
  })

  it('should have to correct behavior', async () => {
    const tester = new HookTester((args) => new AsyncSeriesHook(args))

    const result = await tester.run()

    expect(result).toMatchSnapshot()
  })
})

describe('AsyncSeriesBailHook', () => {
  it('should have to correct behavior', async () => {
    const tester = new HookTester((args) => new AsyncSeriesBailHook(args))

    const result = await tester.run()

    expect(result).toMatchSnapshot()
  })

  it('should not crash with many plugins', () => {
    const hook = new AsyncSeriesBailHook(['x'])
    for (let i = 0; i < 1000; i++) {
      hook.tap('Test', () => 42)
    }
    hook.tapAsync('Test', (x, callback) => callback(null, 42))
    hook.tapPromise('Test', (x) => Promise.resolve(42))
    return expect(hook.promise()).resolves.toBe(42)
  })
})

describe('AsyncSeriesWaterfallHook', () => {
  it('should have to correct behavior', async () => {
    const tester = new HookTester((args) => new AsyncSeriesWaterfallHook(args))

    const result = await tester.run()

    expect(result).toMatchSnapshot()
  })
})

describe('AsyncSeriesLoopHook', () => {
  it('should have to correct behavior', async () => {
    const tester = new HookTester((args) => new AsyncSeriesLoopHook(args))

    const result = await tester.runForLoop()

    expect(result).toMatchSnapshot()
  })
})
