// F52 — slider: read-only thumb consumed arrow keys without acting (0.148
// attached the keydown unconditionally). Repro: focus the read-only thumb
// and press ArrowRight — the value must not change AND the page should
// scroll (native fallback). The page below is intentionally tall so the
// scroll is observable.
import { Option, Schema } from 'effect'
import { Runtime, Subscription, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Slider } from '@foldkit/ui'

// MODEL

const Model = Schema.Struct({
  ratingValue: Schema.Number,
  ratingDemo: Slider.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotSliderMessage: { message: Slider.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldSliderOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({ model: modifyFields(model, { ratingValue: () => value }) }),
})

const foldSlider = Update.foldChild({
  update: Slider.update,
  read: (model: Model) => Option.some(model.ratingDemo),
  write: (model, nextRatingDemo) =>
    modifyFields(model, { ratingDemo: () => nextRatingDemo }),
  toParentMessage: message => Message.GotSliderMessage({ message }),
  foldOutMessage: foldSliderOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotSliderMessage: ({ message }) => foldSlider(model, message),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    ratingValue: Slider.snapAndClamp(3, 0, 10, 1),
    ratingDemo: Slider.init({ id: 'rating', min: 0, max: 10, step: 1 }),
  },
})

// SUBSCRIPTIONS

const sliderSubscriptions = Subscription.lift({
  sliderPointer: Slider.subscriptions.dragPointer,
  sliderEscape: Slider.subscriptions.dragEscape,
})<Model, Message>({
  toChildModel: model => model.ratingDemo,
  toParentMessage: message => Message.GotSliderMessage({ message }),
})

const subscriptions = Subscription.aggregate(sliderSubscriptions)

// VIEW

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F52 — read-only slider arrow keys',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md min-h-[200vh]')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Focus the read-only thumb and press ArrowRight. The value must stay 3 and the page should scroll (native fallback). Buggy (0.148): the key was swallowed — no scroll.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [`value=${String(model.ratingValue)}`],
      ),
      h.submodel({
        slotId: 'rating',
        model: model.ratingDemo,
        view: Slider.view,
        viewInputs: {
          value: model.ratingValue,
          isReadOnly: true,
          formatValue: value => `${String(value)} of 10`,
          toView: attributes =>
            h.div(
              [h.Class('flex flex-col gap-2 w-full max-w-sm')],
              [
                h.div(
                  [h.Class('flex items-center justify-between text-sm')],
                  [
                    h.label(
                      [...attributes.label, h.Class('font-medium')],
                      ['Rating'],
                    ),
                    h.span(
                      [h.Class('tabular-nums text-gray-600')],
                      [`${String(model.ratingValue)} / 10`],
                    ),
                  ],
                ),
                h.div(
                  [
                    ...attributes.root,
                    h.Class('relative h-6 w-full flex items-center'),
                  ],
                  [
                    h.div(
                      [
                        ...attributes.track,
                        h.Class('h-1.5 w-full rounded-full bg-gray-200'),
                      ],
                      [
                        h.div([
                          ...attributes.filledTrack,
                          h.Class('h-full rounded-full bg-blue-600'),
                        ]),
                      ],
                    ),
                    h.div([
                      ...attributes.thumb,
                      h.Class(
                        'h-5 w-5 rounded-full bg-white border-2 border-blue-600 shadow focus-visible:ring-2 focus-visible:ring-blue-600',
                      ),
                    ]),
                  ],
                ),
              ],
            ),
        },
        toParentMessage: message => Message.GotSliderMessage({ message }),
      }),
      h.div(
        [h.Class('h-[150vh]')],
        [
          h.p(
            [h.Class('text-gray-400 text-sm mt-[120vh]')],
            ['Scrollable space below the slider'],
          ),
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
  subscriptions,
  container: document.getElementById('root'),
  devTools: {
    Message,
  },
})

Runtime.run(application)
