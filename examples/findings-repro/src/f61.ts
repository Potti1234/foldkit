// F61 — listbox: a virtual click (element.click(), event.detail === 0)
// on an unhighlighted item committed a selection (0.163 dispatched
// SelectedItem for every click). Repro: open the listbox and press the
// "virtual-click Banana" button — Banana must NOT select; a real pointer
// click still does.
import { Effect, Option, Schema } from 'effect'
import { Command, Dom, Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Listbox } from '@foldkit/ui'

const FruitListbox = Listbox.create()

// MODEL

const Model = Schema.Struct({
  listboxDemo: Listbox.Model,
  maybeSelected: Schema.Option(Schema.String),
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotListboxMessage: { message: Listbox.Message },
  ClickedVirtualClickButton: {},
  CompletedVirtualClickBanana: {},
})
type Message = typeof Message.Type

// COMMAND

const VirtualClickBanana = Command.define('VirtualClickBanana', {
  messages: [Message.CompletedVirtualClickBanana],
  execute: Effect.as(
    Effect.ignore(Dom.clickElement('#demo-item-1')),
    Message.CompletedVirtualClickBanana(),
  ),
})

// UPDATE

const foldListboxOutMessage = Listbox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeSelected: () => Option.some(value),
      }),
    }),
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
    ClickedVirtualClickButton: () => ({
      model,
      commands: [VirtualClickBanana()],
    }),
    CompletedVirtualClickBanana: () => ({ model }),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    listboxDemo: Listbox.init({ id: 'demo' }),
    maybeSelected: Option.none(),
  },
})

// VIEW

const FRUITS = ['Apple', 'Banana', 'Cherry']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F61 — listbox virtual click',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Open the listbox (so "Banana" is not highlighted), then press the button below — it calls element.click() on Banana (a virtual click, detail=0). Banana must NOT select; it only counts once highlighted, matching Base UI. Buggy (pre-fix): it selected immediately.',
        ],
      ),
      h.button(
        [
          h.Class(
            'w-fit rounded bg-gray-800 px-3 py-1.5 text-sm text-white',
          ),
          h.OnClick(Message.ClickedVirtualClickButton()),
        ],
        ['virtual-click Banana'],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `selected=${Option.match(model.maybeSelected, {
            onNone: () => 'none',
            onSome: value => value,
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
          maybeSelectedValue: model.maybeSelected,
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
