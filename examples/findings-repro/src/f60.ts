// F60 — listbox: arrow navigation wrapped at the list ends (0.163 used
// the wrapping keyToIndex), so ArrowDown on the last option jumped back
// to the first instead of staying put. Repro: open the listbox, ArrowDown
// to the last option, ArrowDown again — the active option must stay on
// the last; ArrowUp at the first mirrors it.
import { Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Listbox } from '@foldkit/ui'

const FruitListbox = Listbox.create()

// MODEL

const Model = Schema.Struct({
  listboxDemo: Listbox.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotListboxMessage: { message: Listbox.Message },
})
type Message = typeof Message.Type

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
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: { listboxDemo: Listbox.init({ id: 'demo' }) },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F60 — listbox edge focus',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Open the listbox, ArrowDown to the last option, then ArrowDown once more: the highlight must stay on "Cherry" (clamped at the edge). Buggy (pre-fix): it wrapped back to "Apple". ArrowUp at the first option mirrors it.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `active=${Option.match(model.listboxDemo.maybeActiveItemIndex, {
            onNone: () => 'none',
            onSome: index => String(index),
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
