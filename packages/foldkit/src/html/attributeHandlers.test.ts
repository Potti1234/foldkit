import { Context, Option } from 'effect'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MountTracker } from '../mount/index.js'
import { Dispatch } from '../runtime/index.js'
import { __htmlBuilder } from './index.js'
import {
  type DispatchSync,
  clearRuntime,
  setRuntime,
} from './runtimeSingleton.js'

/**
 * Pins that attribute handlers apply their effect when the element is
 * built. The handler record's mapped type cannot catch an arm that stays
 * curried (a function returning a function is assignable to a
 * void-returning signature), so a curried arm compiles while silently
 * never touching the vnode. AllowDrop shipped with exactly that shape.
 */

type Message = Readonly<{ _tag: 'IgnoredMouseClick' }>

const h = __htmlBuilder<Message>()

const setUpRuntime = (dispatchSync: DispatchSync = () => {}): void => {
  const dispatchService = Dispatch.of({
    dispatchAsync: () =>
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      Promise.resolve() as unknown as ReturnType<
        typeof Dispatch.Service.dispatchAsync
      >,
    dispatchSync,
  })
  const context = Context.make(Dispatch, dispatchService).pipe(
    Context.add(MountTracker, {
      started: () => {},
      ended: () => {},
    }),
  )
  setRuntime(dispatchSync, context)
}

beforeEach(() => {
  setUpRuntime()
})

afterEach(() => {
  clearRuntime()
})

describe('AllowDrop', () => {
  it('registers a dragover handler that prevents the default', () => {
    const vnode = h.div([h.AllowDrop()])

    const dragoverHandler = vnode?.data?.on?.['dragover']
    expect(typeof dragoverHandler).toBe('function')

    let isDefaultPrevented = false
    const event = {
      preventDefault: () => {
        isDefaultPrevented = true
      },
    }
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ;(dragoverHandler as (event: unknown) => void)(event)
    expect(isDefaultPrevented).toBe(true)
  })
})

describe('OnClickDetail', () => {
  it('dispatches the mapped message for the event detail', () => {
    const dispatched: Array<unknown> = []
    setUpRuntime(message => {
      dispatched.push(message)
    })

    const vnode = h.div([
      h.OnClickDetail(detail =>
        detail === 0
          ? Option.some({ _tag: 'IgnoredMouseClick' })
          : Option.none(),
      ),
    ])

    const clickHandler = vnode?.data?.on?.['click']
    expect(typeof clickHandler).toBe('function')

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ;(clickHandler as (event: unknown) => void)({ detail: 0 })
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ;(clickHandler as (event: unknown) => void)({ detail: 1 })

    expect(dispatched).toEqual([{ _tag: 'IgnoredMouseClick' }])
  })
})

describe('OnContextMenuPreventDefault', () => {
  it('prevents the default without dispatching when no message is given', () => {
    const dispatched: Array<unknown> = []
    setUpRuntime(message => {
      dispatched.push(message)
    })

    const vnode = h.div([h.OnContextMenuPreventDefault()])

    const contextmenuHandler = vnode?.data?.on?.['contextmenu']
    expect(typeof contextmenuHandler).toBe('function')

    let isDefaultPrevented = false
    const event = {
      preventDefault: () => {
        isDefaultPrevented = true
      },
    }
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ;(contextmenuHandler as (event: unknown) => void)(event)

    expect(isDefaultPrevented).toBe(true)
    expect(dispatched).toEqual([])
  })

  it('dispatches the message when one is given', () => {
    const dispatched: Array<unknown> = []
    setUpRuntime(message => {
      dispatched.push(message)
    })

    const vnode = h.div([
      h.OnContextMenuPreventDefault({ _tag: 'IgnoredMouseClick' }),
    ])

    const contextmenuHandler = vnode?.data?.on?.['contextmenu']
    expect(typeof contextmenuHandler).toBe('function')

    let isDefaultPrevented = false
    const event = {
      preventDefault: () => {
        isDefaultPrevented = true
      },
    }
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
    ;(contextmenuHandler as (event: unknown) => void)(event)

    expect(isDefaultPrevented).toBe(true)
    expect(dispatched).toEqual([{ _tag: 'IgnoredMouseClick' }])
  })
})
