// F57 — combobox: the popup unmounted when the filter matched zero
// options (0.163 gated the panel on items being non-empty), collapsing
// aria-expanded and dropping the modal backdrop while the combobox was
// still open. Repro: type 'zzz' — the panel must stay mounted (empty but
// visible) so it can host an empty-state message.
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
  title: 'F57 — combobox empty-match popup',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Type "zzz" so no option matches: the bordered popup must stay mounted, holding the "No matches" hint. Buggy (pre-fix): the popup unmounted entirely and aria-expanded collapsed while the combobox still read as open.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `open=${String(model.comboDemo.isOpen)} inputValue="${model.comboDemo.inputValue}"`,
        ],
      ),
      h.submodel({
        slotId: 'combo',
        model: model.comboDemo,
        view: FruitCombobox.view,
        viewInputs: {
          items: FRUITS.filter(fruit =>
            fruit
              .toLowerCase()
              .includes(model.comboDemo.inputValue.toLowerCase()),
          ),
          itemToConfig: (item, { isActive }) => ({
            content: h.span([], [item]),
            className: isActive ? 'bg-blue-100' : '',
          }),
          itemToValue: item => item,
          itemToDisplayText: item => item,
          maybeSelectedValue: Option.none(),
          restingInputValue: '',
          itemsClassName:
            'mt-1 block w-full min-h-10 rounded border border-gray-300 bg-white p-1 shadow',
        },
        toParentMessage: message => Message.GotComboboxMessage({ message }),
      }),
      h.p(
        [h.Class('text-xs text-gray-400')],
        [
          'The bordered panel is the popup: it should remain visible holding no options. An "empty state" slot can live there (Base UI keeps it mounted for exactly this reason).',
        ],
      ),
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
