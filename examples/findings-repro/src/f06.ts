// F6 — combobox: Enter on an empty list threw `Schema validation failed`
// (0.148 armed maybeActiveItemIndex=-1 into RequestedItemClick({index:-1})).
// Repro: focus the input, type "zzz" (no match → empty list), press Enter.
// Expected on current code: nothing happens (SuppressedItemCommit). On the
// buggy version each Enter throws a schema error into the console/devtools.
import { Array, Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { childAttributes } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox } from '@foldkit/ui'

// MODEL

const City = Schema.Literals(['Johannesburg', 'Kyiv', 'Oxford', 'Wellington'])
type City = typeof City.Type

const CityCombobox = Combobox.create<City>()

const Model = Schema.Struct({
  maybeCity: Schema.Option(City),
  combobox: Combobox.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotComboboxMessage: { message: Combobox.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldComboboxOutMessage = Combobox.OutMessage.match<
  Update.Step<Model, Message>,
  Combobox.OutMessage<City>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { maybeCity: () => Option.some(value) }),
    }),
  ClearedSelection: () => model => ({ model }),
})

const foldCombobox = Update.foldChild({
  update: CityCombobox.update,
  read: (model: Model) => Option.some(model.combobox),
  write: (model, nextCombobox) =>
    modifyFields(model, { combobox: () => nextCombobox }),
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
    maybeCity: Option.none(),
    combobox: Combobox.init({ id: 'city' }),
  },
})

// VIEW

const cities: ReadonlyArray<City> = [
  'Johannesburg',
  'Kyiv',
  'Oxford',
  'Wellington',
]

const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const filteredCities =
    model.combobox.inputValue === ''
      ? cities
      : Array.filter(cities, city =>
          city.toLowerCase().includes(model.combobox.inputValue.toLowerCase()),
        )

  return {
    title: 'F6 — combobox Enter on empty list',
    body: h.div(
      [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
      [
        h.p(
          [h.Class('text-sm text-gray-600')],
          [
            'Type "zzz" so the list is empty, then press Enter repeatedly. Buggy: a Schema validation error per press. Fixed: nothing.',
          ],
        ),
        h.p(
          [h.Class('text-xs font-mono text-gray-500 repro-status')],
          [
            `isOpen=${String(model.combobox.isOpen)} items=${String(filteredCities.length)} input="${model.combobox.inputValue}"`,
          ],
        ),
        h.submodel({
          slotId: 'city',
          model: model.combobox,
          view: CityCombobox.view,
          viewInputs: {
            items: filteredCities,
            maybeSelectedValue: model.maybeCity,
            restingInputValue: Option.getOrElse(model.maybeCity, () => ''),
            itemToValue: city => city,
            itemToDisplayText: city => city,
            itemToConfig: city => ({
              className: 'px-3 py-2 cursor-pointer data-[active]:bg-blue-100',
              content: h.span([], [city]),
            }),
            inputAttributes: childAttributes([
              h.Class('w-full rounded-lg border px-3 py-2'),
              h.Placeholder('Search cities...'),
            ]),
            itemsAttributes: childAttributes([
              h.Class('rounded-lg border shadow-lg bg-white'),
            ]),
            backdropAttributes: childAttributes([h.Class('fixed inset-0')]),
            anchor: { placement: 'bottom-start', gap: 4, padding: 8 },
          },
          toParentMessage: message => Message.GotComboboxMessage({ message }),
        }),
      ],
    ),
  }
}

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
