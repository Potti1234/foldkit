// F55 — combobox: arrow navigation wrapped at the list ends, so the
// highlight could never return to the input (0.163 wrapped via
// wrapIndex). Repro: open the combobox and press ArrowDown past the last
// option — the highlight must come back to the input (active = none);
// ArrowDown again highlights the first option, ArrowUp past the first
// mirrors it.
import { Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox } from '@foldkit/ui'

const FruitCombobox = Combobox.create()

// MODEL

const Model = Schema.Struct({
  comboDemo: Combobox.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotComboboxMessage: { message: Combobox.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldComboboxOutMessage = Combobox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected: () => model => ({ model }),
  ClearedSelection: () => model => ({ model }),
})

const foldCombobox = Update.foldChild({
  update: FruitCombobox.update,
  read: (model: Model) => Option.some(model.comboDemo),
  write: (model, nextComboDemo) =>
    modifyFields(model, { comboDemo: () => nextComboDemo }),
  toParentMessage: message => Message.GotComboboxMessage({ message }),
  foldOutMessage: foldComboboxOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotComboboxMessage: ({ message }) => foldCombobox(model, message),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: { comboDemo: Combobox.init({ id: 'combo' }) },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F55 — combobox edge navigation',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Open the combobox and press ArrowDown past the last option: the highlight must return to the input (active = none). ArrowDown again highlights the first option; ArrowUp past the first mirrors it. Buggy (pre-fix): the highlight wrapped to the other end and could never rest on the input.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `active=${Option.match(model.comboDemo.maybeActiveItemIndex, {
            onNone: () => 'none (on the input)',
            onSome: index => String(index),
          })}`,
        ],
      ),
      h.submodel({
        slotId: 'combo',
        model: model.comboDemo,
        view: FruitCombobox.view,
        viewInputs: {
          items: FRUITS,
          itemToConfig: (item, { isActive }) => ({
            content: h.span([], [item]),
            className: isActive ? 'bg-blue-100' : '',
          }),
          itemToValue: item => item,
          itemToDisplayText: item => item,
          maybeSelectedValue: Option.none(),
          restingInputValue: '',
        },
        toParentMessage: message => Message.GotComboboxMessage({ message }),
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
