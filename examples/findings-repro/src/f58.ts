// F58 — combobox: a disabled combobox's hidden form inputs were not
// disabled, so the selection still submitted with the form (0.163 never
// emitted `disabled` on the mirror inputs). Repro: the status line reads
// input[name="fruit"].disabled live — it must be true.
import { Effect, Option, Schema } from 'effect'
import { Mount, Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox } from '@foldkit/ui'

const FruitCombobox = Combobox.create()

// MODEL

const Model = Schema.Struct({
  comboDemo: Combobox.Model,
  maybeHiddenDisabled: Schema.Option(Schema.Boolean),
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotComboboxMessage: { message: Combobox.Message },
  ProbedHiddenInput: { disabled: Schema.Boolean },
})
type Message = typeof Message.Type

// MOUNT

const ProbeHiddenInput = Mount.define('ProbeHiddenInput', {
  messages: [Message.ProbedHiddenInput],
  execute: ({ element }) =>
    Effect.succeed(
      Message.ProbedHiddenInput({
        disabled:
          element.parentElement?.querySelector<HTMLInputElement>(
            'input[name="fruit"]',
          )?.disabled ?? false,
      }),
    ),
})

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
    ProbedHiddenInput: ({ disabled }) => ({
      model: modifyFields(model, {
        maybeHiddenDisabled: () => Option.some(disabled),
      }),
    }),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    comboDemo: Combobox.init({ id: 'combo' }),
    maybeHiddenDisabled: Option.none(),
  },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F58 — disabled combobox hidden input',
  body: h.div(
    [
      h.Class('p-8 font-sans flex flex-col gap-3 max-w-md'),
      h.OnMount(ProbeHiddenInput()),
    ],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'The combobox below is disabled and pre-selected, so it renders a hidden input name="fruit" for form submission. The probe reads input.disabled live — it must be true so the disabled combobox cannot leak its value into a submission. Buggy (pre-fix): false.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `hidden.disabled=${Option.match(model.maybeHiddenDisabled, {
            onNone: () => 'probing…',
            onSome: disabled => String(disabled),
          })}`,
        ],
      ),
      h.submodel({
        slotId: 'combo',
        model: model.comboDemo,
        view: FruitCombobox.view,
        viewInputs: {
          items: FRUITS,
          itemToConfig: item => ({ content: h.span([], [item]) }),
          itemToValue: item => item,
          itemToDisplayText: item => item,
          maybeSelectedValue: Option.some('Apple'),
          restingInputValue: 'Apple',
          formName: 'fruit',
          isDisabled: true,
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
