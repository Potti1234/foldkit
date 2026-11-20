// F59 — listbox: a vertical listbox emitted aria-orientation="vertical",
// which is the ARIA default and pure noise (0.163 set it unconditionally).
// Repro: open the listbox — the probe reads the items container's
// aria-orientation live; it must be absent (horizontal still emits
// "horizontal").
import { Effect, Option, Schema } from 'effect'
import { Mount, Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Listbox } from '@foldkit/ui'

const FruitListbox = Listbox.create()

// MODEL

const Model = Schema.Struct({
  listboxDemo: Listbox.Model,
  maybeOrientation: Schema.Option(Schema.String),
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotListboxMessage: { message: Listbox.Message },
  ProbedOrientation: { orientation: Schema.String },
})
type Message = typeof Message.Type

// MOUNT

const ProbeOrientation = Mount.define('ProbeOrientation', {
  messages: [Message.ProbedOrientation],
  execute: ({ element }) =>
    Effect.succeed(
      Message.ProbedOrientation({
        orientation:
          element.parentElement
            ?.querySelector('#demo-items')
            ?.getAttribute('aria-orientation') ?? 'absent',
      }),
    ),
})

// UPDATE

const foldListboxOutMessage = Listbox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected: () => model => ({ model }),
})

const foldListbox = Update.foldChild({
  update: FruitListbox.update,
  read: (model: Model) => Option.some(model.listboxDemo),
  write: (model, nextListboxDemo) =>
    modifyFields(model, { listboxDemo: () => nextListboxDemo }),
  toParentMessage: message => Message.GotListboxMessage({ message }),
  foldOutMessage: foldListboxOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotListboxMessage: ({ message }) => foldListbox(model, message),
    ProbedOrientation: ({ orientation }) => ({
      model: modifyFields(model, {
        maybeOrientation: () => Option.some(orientation),
      }),
    }),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    listboxDemo: Listbox.init({ id: 'demo' }),
    maybeOrientation: Option.none(),
  },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F59 — vertical listbox aria-orientation',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Open the listbox: the probe mounts and reads the items container\'s aria-orientation live. Expected: "absent" (vertical is the ARIA default). Buggy (pre-fix): "vertical".',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `aria-orientation=${Option.match(model.maybeOrientation, {
            onNone: () => 'probing… (open the listbox)',
            onSome: orientation => `"${orientation}"`,
          })}`,
        ],
      ),
      h.submodel({
        slotId: 'listbox',
        model: model.listboxDemo,
        view: FruitListbox.view,
        viewInputs: {
          items: FRUITS,
          itemToConfig: (item, { isActive }) => ({
            content: h.span([], [item]),
            className: isActive ? 'bg-blue-100' : '',
          }),
          itemToValue: item => item,
          maybeSelectedValue: Option.none(),
          buttonContent: h.span([], ['Pick a fruit']),
          itemsClassName:
            'mt-1 block w-48 rounded border border-gray-300 bg-white p-1 shadow',
        },
        toParentMessage: message => Message.GotListboxMessage({ message }),
      }),
      ...(model.listboxDemo.isOpen
        ? [h.div([h.OnMount(ProbeOrientation())])]
        : []),
    ],
  ),
})

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: {
    Message,
  },
})

Runtime.run(application)
