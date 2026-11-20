// F56 — combobox: Home and End inside the open combobox navigated the
// highlighted option and suppressed the native caret move (0.163 matched
// them in the input keydown). Repro: focus the input and press Home/End —
// the text caret must move (watch selectionStart in DevTools); no option
// may highlight.
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
  model: {
    comboDemo: Combobox.init({
      id: 'combo',
      inputValue: 'pineapple upside down',
    }),
  },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F56 — combobox Home/End caret',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Focus the input and press Home or End: the caret must move inside the text (check selectionStart in DevTools) and no option may highlight. Buggy (pre-fix): Home/End activated the first/last option and ate the caret move.',
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
          openOnFocus: true,
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
