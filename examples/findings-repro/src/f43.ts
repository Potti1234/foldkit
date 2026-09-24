// F43 — listbox (used as a select): closed-state typeahead is inert.
// `handleButtonKeyDown` while closed maps only Enter/Space/arrows, so typing
// a letter on the closed trigger does not move the highlighted option —
// a native <select> matches by prefix while closed.
// Repro: focus the closed trigger and press "p". Buggy: nothing happens.
// Expected: the button shows (or is ready to show) "Pro".
import { Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Listbox } from '@foldkit/ui'

// MODEL

const Plan = Schema.Literals(['Free', 'Pro', 'Enterprise'])
type Plan = typeof Plan.Type

const PlanListbox = Listbox.create<Plan>()

const Model = Schema.Struct({
  maybePlan: Schema.Option(Plan),
  listbox: Listbox.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotListboxMessage: { message: Listbox.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldListboxOutMessage = Listbox.OutMessage.match<
  Update.Step<Model, Message>,
  Listbox.OutMessage<Plan>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { maybePlan: () => Option.some(value) }),
    }),
})

const foldListbox = Update.foldChild({
  update: PlanListbox.update,
  read: (model: Model) => Option.some(model.listbox),
  write: (model, nextListbox) =>
    modifyFields(model, { listbox: () => nextListbox }),
  toParentMessage: message => Message.GotListboxMessage({ message }),
  foldOutMessage: foldListboxOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotListboxMessage: ({ message }) => foldListbox(model, message),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    maybePlan: Option.some('Free'),
    listbox: Listbox.init({ id: 'plan' }),
  },
})

// VIEW

const plans: ReadonlyArray<Plan> = ['Free', 'Pro', 'Enterprise']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F43 — closed-select typeahead',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Tab to (or click-focus then Escape) the closed trigger, then press "p". Buggy: nothing happens. Native <select> behavior: the highlight moves to "Pro".',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `selected=${Option.getOrElse(model.maybePlan, () => 'none')} isOpen=${String(model.listbox.isOpen)}`,
        ],
      ),
      h.label([h.For(Listbox.buttonId('plan'))], ['Plan']),
      h.submodel({
        slotId: 'plan',
        model: model.listbox,
        view: PlanListbox.view,
        viewInputs: {
          items: plans,
          maybeSelectedValue: model.maybePlan,
          buttonContent: h.span(
            [],
            [Option.getOrElse(model.maybePlan, () => 'Select a plan')],
          ),
          buttonClassName:
            'w-full rounded-lg border px-3 py-2 text-left bg-white',
          itemsClassName: 'rounded-lg border shadow-lg bg-white',
          itemToConfig: (plan, { isSelected }) => ({
            className:
              'px-3 py-2 cursor-pointer data-[active]:bg-blue-100 flex items-center gap-2',
            content: h.span([], [isSelected ? `✓ ${plan}` : `  ${plan}`]),
          }),
          backdropClassName: 'fixed inset-0',
          anchor: { placement: 'bottom-start', gap: 4, padding: 8 },
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
