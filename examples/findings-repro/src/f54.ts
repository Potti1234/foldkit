// F54 — tooltip: stale generation wedge after a remount.
// Under rapid interaction + a subtree remount, tooltips wedge dead until
// reload — suspected stale delayed-Command / pendingShowVersion race crossing
// the remount. Not deterministically reproducible.
// Repro: press "Start hammer" — a ticker remounts the tooltip subtree every
// 250ms (same slotId, different wrapper) while you hover the trigger. Stop
// and hover: the tooltip must still appear.
import { Effect, Option, Schema } from 'effect'
import { Command, Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Tooltip } from '@foldkit/ui'

// MODEL

const Model = Schema.Struct({
  tooltip: Tooltip.Model,
  isHammering: Schema.Boolean,
  isFlipped: Schema.Boolean,
  remounts: Schema.Number,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotTooltipMessage: { message: Tooltip.Message },
  ClickedStartHammer: {},
  ClickedStopHammer: {},
  ClickedFlipOnce: {},
  TickedRemount: {},
})
type Message = typeof Message.Type

// COMMAND

const TickRemount = Command.define('TickRemount', {
  messages: [Message.TickedRemount],
  execute: Effect.sleep('250 millis').pipe(Effect.as(Message.TickedRemount())),
})

// UPDATE

const foldTooltipOutMessage = Tooltip.OutMessage.match<
  Update.Step<Model, Message>
>({
  Shown: () => model => ({ model }),
  Hidden: () => model => ({ model }),
})

const foldTooltip = Update.foldChild({
  update: Tooltip.update,
  read: (model: Model) => Option.some(model.tooltip),
  write: (model, nextTooltip) =>
    modifyFields(model, { tooltip: () => nextTooltip }),
  toParentMessage: message => Message.GotTooltipMessage({ message }),
  foldOutMessage: foldTooltipOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotTooltipMessage: ({ message }) => foldTooltip(model, message),
    ClickedStartHammer: () => ({
      model: modifyFields(model, { isHammering: () => true }),
      commands: [TickRemount()],
    }),
    ClickedStopHammer: () => ({
      model: modifyFields(model, { isHammering: () => false }),
    }),
    ClickedFlipOnce: () => ({
      model: modifyFields(model, {
        isFlipped: isFlipped => !isFlipped,
        remounts: remounts => remounts + 1,
      }),
    }),
    TickedRemount: () => {
      const nextModel = modifyFields(model, {
        isFlipped: isFlipped => !isFlipped,
        remounts: remounts => remounts + 1,
      })

      if (model.isHammering) {
        return { model: nextModel, commands: [TickRemount()] }
      } else {
        return { model: nextModel }
      }
    },
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: {
    tooltip: Tooltip.init({ id: 'save-button' }),
    isHammering: false,
    isFlipped: false,
    remounts: 0,
  },
})

// VIEW

const tooltipView = (model: Model, h: HtmlBuilder<Message>, accent: string) =>
  h.submodel({
    slotId: 'save-button',
    model: model.tooltip,
    view: Tooltip.view,
    viewInputs: {
      ariaLabel: 'Save',
      anchor: { placement: 'top', gap: 6, padding: 8 },
      toView: ({ trigger, panel, isVisible }) =>
        h.span(
          [h.Class('relative inline-block')],
          [
            h.button(
              [
                ...trigger,
                h.Class(`rounded-lg border px-3 py-2 cursor-pointer ${accent}`),
              ],
              [h.span([], ['💾 Save'])],
            ),
            ...(isVisible
              ? [
                  h.div(
                    [
                      ...panel,
                      h.Class(
                        'rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-lg whitespace-nowrap',
                      ),
                    ],
                    [h.span([], ['Save your changes (⌘S)'])],
                  ),
                ]
              : []),
          ],
        ),
    },
    toParentMessage: message => Message.GotTooltipMessage({ message }),
  })

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F54 — tooltip remount wedge',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Start the hammer (remounts the tooltip subtree every 250ms), hover the trigger while it churns, stop, then hover again — the tooltip must still appear. Watch isOpen below.',
        ],
      ),
      h.div(
        [h.Class('flex gap-2')],
        [
          h.button(
            [
              h.Class('rounded border px-3 py-1.5 bg-white cursor-pointer'),
              h.OnClick(Message.ClickedStartHammer()),
            ],
            ['Start hammer'],
          ),
          h.button(
            [
              h.Class('rounded border px-3 py-1.5 bg-white cursor-pointer'),
              h.OnClick(Message.ClickedStopHammer()),
            ],
            ['Stop'],
          ),
          h.button(
            [
              h.Class('rounded border px-3 py-1.5 bg-white cursor-pointer'),
              h.OnClick(Message.ClickedFlipOnce()),
            ],
            ['Flip once'],
          ),
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [
          `isOpen=${String(model.tooltip.isOpen)} isHovered=${String(model.tooltip.isHovered)} isDismissed=${String(model.tooltip.isDismissed)} pendingShowVersion=${String(model.tooltip.pendingShowVersion)} remounts=${String(model.remounts)}`,
        ],
      ),
      h.div(
        [h.Class('mt-8')],
        [
          model.isFlipped
            ? h.div(
                [h.Class('p-2 border border-blue-200 rounded inline-block')],
                [tooltipView(model, h, 'border-blue-400')],
              )
            : h.section(
                [h.Class('m-1 border border-amber-200 rounded inline-block')],
                [tooltipView(model, h, 'border-amber-400')],
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
  container: document.getElementById('root'),
  devTools: {
    Message,
  },
})

Runtime.run(application)
