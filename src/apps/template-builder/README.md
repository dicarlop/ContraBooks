# ContraBooks Template Builder app

The Template Builder is the first bundled ContraBooks app.

It is intentionally isolated behind the ContraBooks app contract so its UI and implementation can evolve independently of the core shell.

## Local-first

This app does not require a cloud service. Templates, accounting data, and generated documents continue to use ContraBooks' local database and desktop APIs.

The app contract is intentionally small. The host owns application lifecycle, routing, permissions, persistence APIs, and desktop IPC; the Template Builder owns its visual design workflow.

## Future

The same structure can be used for optional apps such as Payroll, POS, Inventory, Projects, and CRM without forcing those apps to share the same UI implementation or build tooling.
