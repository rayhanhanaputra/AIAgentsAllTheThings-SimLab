# AIAgentsAllTheThings SimLab

SimLab is a local, fictional IoT target for the
[AIAgentsAllTheThings](../AIAgentsAllTheThings) Workbench. Send any modeled input
channel to the target API and watch the sensor, agent decision, synthetic actuator,
and resulting evidence update in real time.

The included scenarios are Smart Farm, Water Treatment, Warehouse Robotics, Hospital
Climate, Smart Building, and a non-operational Strategic Command safety drill. No real
industrial, medical, weapon, or infrastructure protocol is implemented.

## Run

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:4318>.

## Connect the Workbench

Create an HTTP target in AIAgentsAllTheThings:

| Setting          | Value                             |
| ---------------- | --------------------------------- |
| Environment      | Staging                           |
| Connector        | HTTP                              |
| Endpoint         | `http://127.0.0.1:4318/api/agent` |
| Method           | POST                              |
| Request template | `{"input":"{{body}}"}`            |
| Response path    | `text`                            |
| Actions path     | `actions`                         |
| Response marker  | `SIMLAB_EVENT`                    |

Optional out-of-band observation:

- HTTP observer: `http://127.0.0.1:4318/api/observer`
- Browser observer: `http://127.0.0.1:4318`
- Browser selector: `[data-testid="agent-response"]`

The **Target setup** drawer inside SimLab can copy the complete target profile. The
Workbench badge changes only after a real external request reaches `/api/agent`.

## Test

With the development server running:

```bash
npm run test:smoke
npm run build
```

The simulation defaults to a basic controller to demonstrate the failure. Switch to
the validated controller to see the same instruction contained without changing the
synthetic actuator.
