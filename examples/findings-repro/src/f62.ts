// F62 — menu: right-clicking the backdrop of an open menu raised the
// browser context menu over the UI (the backdrop had no contextmenu
// handler). Repro: open the menu and right-click the dimmed backdrop —
// no native context menu may appear and the app menu stays open.
import { Option, Schema } from 'effect'
import { Runtime, Update } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Menu } from '@foldkit/ui'

const ActionMenu = Menu.create()

// MODEL

const Model = Schema.Struct({
  menuDemo: Menu.Model,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  GotMenuMessage: { message: Menu.Message },
})
type Message = typeof Message.Type

// UPDATE

const foldMenuOutMessage = Menu.OutMessage.match<Update.Step<Model, Message>>({
  Selected: () => model => ({ model }),
})

const foldMenu = Update.foldChild({
  update: ActionMenu.update,
  read: (model: Model) => Option.some(model.menuDemo),
  write: (model, nextMenuDemo) =>
    modifyFields(model, { menuDemo: () => nextMenuDemo }),
  toParentMessage: message => Message.GotMenuMessage({ message }),
  foldOutMessage: foldMenuOutMessage,
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotMenuMessage: ({ message }) => foldMenu(model, message),
  })

// INIT

const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: { menuDemo: Menu.init({ id: 'menu' }) },
})

// VIEW

const ACTIONS = ['Edit', 'Duplicate', 'Delete']

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'F62 — menu backdrop context menu',
  body: h.div(
    [h.Class('p-8 font-sans flex flex-col gap-3 max-w-md')],
    [
      h.p(
        [h.Class('text-sm text-gray-600')],
        [
          'Open the menu, then right-click the dimmed backdrop around it: the native context menu must NOT appear and the app menu must stay open. Buggy (pre-fix): the browser menu opened over the UI.',
        ],
      ),
      h.p(
        [h.Class('text-xs font-mono text-gray-500 repro-status')],
        [`open=${String(model.menuDemo.isOpen)}`],
      ),
      h.submodel({
        slotId: 'menu',
        model: model.menuDemo,
        view: ActionMenu.view,
        viewInputs: {
          items: ACTIONS,
          itemToConfig: (item, { isActive }) => ({
            content: h.span([], [item]),
            className: isActive ? 'bg-blue-100' : '',
          }),
          buttonContent: h.span([], ['Actions']),
          backdropClassName: 'fixed inset-0 bg-gray-900/30',
          itemsClassName:
            'w-40 rounded border border-gray-300 bg-white p-1 shadow',
        },
        toParentMessage: message => Message.GotMenuMessage({ message }),
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
