// F38 — popover: `placement: 'right'` overflows a narrow viewport.
// Anchor flip/shift lacks a crossAxis shift, so a right-side popover still
// overflows the right edge on a ~390px viewport.
// Repro: a 390px box with the trigger flush right; open the popover and check
// whether the panel's right edge exceeds the viewport (console + visual).
import { Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Popover } from '@foldkit/ui'

// MODEL

const Model = Schema.Struct({
  popover: Popover.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotPopoverMessage: { message: Popover.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldPopoverOutMessage = Popover.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const foldPopover = Update.foldChild({
  update: Popover.update,
  read: (model: Model) => Option.some(model.popover),
  write: (model, nextPopover) =>
    modifyFields(model, { popover: () => nextPopover }),
  toParentMessage: message => Message.GotPopoverMessage({ message }),
  foldOutMessage: foldPopoverOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotPopoverMessage: ({ message }) => foldPopover(model, message),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    popover: Popover.init({ id: 'info' }),
  },
})

// VIEW

const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const labelId = 'info-label'

  return {
    title: 'F38 — popover side=right overflow',
    body: h.div(
      [h.Class('font-sans')],
      [
        h.div(
          [
            h.Class('mx-auto mt-16 p-4 border-2 border-dashed border-red-400'),
            h.Style({ width: '390px' }),
          ],
          [
            h.p(
              [h.Class('text-sm text-gray-600 mb-4')],
              [
                'The dashed box is 390px wide. The trigger is flush right. Click it — buggy: the panel overflows past the viewport edge instead of shifting back inside.',
              ],
            ),
            h.div(
              [h.Class('flex justify-end')],
              [
                h.submodel({
                  slotId: 'info',
                  model: model.popover,
                  view: Popover.view,
                  viewInputs: {
                    ariaLabelledBy: labelId,
                    anchor: { placement: 'right', gap: 4, padding: 8 },
                    toView: ({ button, panel, backdrop, isVisible }) =>
                      h.div(
                        [h.Class('relative inline-block')],
                        [
                          h.label(
                            [h.Id(labelId), h.For(Popover.buttonId('info'))],
                            ['Info'],
                          ),
                          h.button(
                            [
                              ...button,
                              h.Class(
                                'rounded-lg border px-3 py-2 cursor-pointer bg-white',
                              ),
                            ],
                            [h.span([], ['Open right'])],
                          ),
                          ...(isVisible
                            ? [
                                h.div([...backdrop, h.Class('fixed inset-0')]),
                                h.div(
                                  [
                                    ...panel,
                                    h.Class(
                                      'rounded-lg border shadow-lg p-4 w-72 bg-white',
                                    ),
                                  ],
                                  [
                                    h.h3(
                                      [h.Class('font-medium')],
                                      ['Analytics'],
                                    ),
                                    h.p(
                                      [h.Class('text-sm text-gray-500')],
                                      [
                                        'This panel is 288px wide. It should shift left to stay inside the viewport.',
                                      ],
                                    ),
                                  ],
                                ),
                              ]
                            : []),
                        ],
                      ),
                  },
                  toParentMessage: message =>
                    Message.GotPopoverMessage({ message }),
                }),
              ],
            ),
          ],
        ),
        h.p(
          [
            h.Class(
              'text-xs font-mono text-gray-500 text-center mt-4 repro-status',
            ),
          ],
          [`isOpen=${String(model.popover.isOpen)}`],
        ),
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
