import { Effect, Schema as S } from 'effect'
import { describe, expect, it } from 'vitest'

import { Command, Message, Update } from './public.js'

const CompletedReadValue = Message.m('CompletedReadValue', {
  value: S.Number,
})

describe('portable entry point', () => {
  it('constructs a Command without executing its Effect', async () => {
    let isExecuted = false
    const ReadValue = Command.define('ReadValue', {
      messages: [CompletedReadValue],
      execute: Effect.sync(() => {
        isExecuted = true
        return CompletedReadValue({ value: 42 })
      }),
    })

    const command = ReadValue()

    expect(isExecuted).toBe(false)
    expect(command.name).toBe('ReadValue')
    expect(await Effect.runPromise(command.effect)).toEqual(
      CompletedReadValue({ value: 42 }),
    )
    expect(isExecuted).toBe(true)
  })

  it('composes pure update steps without executing Commands', () => {
    type Model = Readonly<{ count: number }>
    type Message = typeof CompletedReadValue.Type

    const increment = (model: Model): Update.Return<Model, Message> => [
      { count: model.count + 1 },
      [],
    ]

    expect(Update.combine({ count: 0 }, [increment, increment])).toEqual([
      { count: 2 },
      [],
    ])
  })
})
