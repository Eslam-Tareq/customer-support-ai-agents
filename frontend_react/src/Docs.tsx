import React from 'react';
import './Docs.css';

export default function Docs() {
  return (
    <div className="docs-container">
      {/* Navigation link to go back to the chat dashboard */}
      <a href="/" className="docs-back-link">
        ← Back to Support Chat Dashboard
      </a>

      {/* Cover/Header Section */}
      <div className="docs-cover">
        <span className="docs-badge">Technical Portfolio Documentation</span>
        <h1 className="docs-title">AI-Powered Customer Support Agent System</h1>
        <p className="docs-subtitle">
          A full-stack, multi-agent customer support simulation orchestrating collaborative AI workflows with an interactive React dashboard.
        </p>

        <div className="docs-meta">
          <div className="docs-meta-item">
            <div className="docs-meta-label">Architecture</div>
            <div className="docs-meta-val">Triage-and-Route (Multi-Agent)</div>
          </div>
          <div className="docs-meta-item">
            <div className="docs-meta-label">Core Technology Stack</div>
            <div className="docs-meta-val">React, Express, OpenAI Agents SDK, TypeScript</div>
          </div>
          <div className="docs-meta-item">
            <div className="docs-meta-label">Date Generated</div>
            <div className="docs-meta-val">July 2026</div>
          </div>
          <div className="docs-meta-item">
            <div className="docs-meta-label">Project Category</div>
            <div className="docs-meta-val">Agentic AI / AI Agents</div>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <section>
        <h1>1. Executive Summary</h1>
        <p>
          Modern customer support applications require robust, contextual, and transactional capabilities. Traditional single-prompt LLM interactions often suffer from context dilution, command confusion, and high token costs. This project addresses these challenges by implementing a stateful, multi-agent orchestrator utilizing OpenAI's experimental <code>@openai/agents</code> SDK.
        </p>

        <div className="docs-callout">
          <div className="docs-callout-title">Core Objective</div>
          <p>
            To design a collaborative team of specialized AI agents that can seamlessly hand off customer conversations to one another, query a product catalog, validate customer security credentials, and perform transactional actions (order cancellations and refunds) while displaying live system logs to the developer.
          </p>
        </div>

        <h2>Architecture Overview</h2>
        <p>The system is split into two major components:</p>
        <ul>
          <li>
            <strong>Express + TypeScript Backend:</strong> Hosts the multi-agent routing loop, hooks up Zod-schema-validated database tools, maintains session states, and handles CORS communication.
          </li>
          <li>
            <strong>React + Vite Frontend:</strong> A high-performance, dark-themed dashboard that visualizes active agent state shifts, executes mock database queries, and renders developer-friendly tool execution logs.
          </li>
        </ul>
      </section>

      {/* Section 2: Agent Architecture */}
      <section>
        <h1>2. Agentic AI & Routing Architecture</h1>
        <p>
          The application implements the industry-standard <strong>Triage & Specialist pattern</strong>. The following diagram illustrates the routing and tool execution flow of the system:
        </p>

        <pre>
{`+-------------------------------------------------------------+
|                        User Input                           |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|            TriageAgent (Main Entry & Classify)              |
+-------------------------------------------------------------+
          /                                         \\
  (Product query)                             (Order action)
        /                                             \\
       v                                               v
+--------------------------+               +--------------------------+
|       CatalogAgent       |               |     OrderRefundAgent     |
|  (Product Specialist)    |               |  (Transaction Specialist)|
+--------------------------+               +--------------------------+
  - searchProducts()                         - getOrderStatus()
  - getProductDetails()                      - cancelOrder()
                                             - processRefund()
       \\                                               /
        \\---> [ Handoff back to TriageAgent ] <-------/`}
        </pre>

        <h2>The Specialist Agent Team</h2>
        <div className="docs-grid">
          <div className="docs-card">
            <h3>TriageAgent</h3>
            <p>
              <strong>Responsibility:</strong> Act as the primary dispatcher. Greets the customer, answers general questions, and classifies incoming statements to route them to the correct specialist.
            </p>
            <p><strong>Model:</strong> <code>gpt-4o-mini</code></p>
          </div>
          <div className="docs-card">
            <h3>CatalogAgent</h3>
            <p>
              <strong>Responsibility:</strong> Serves as the inventory expert. Searches items in stock, compares categories, and retrieves specific descriptions.
            </p>
            <p><strong>Model:</strong> <code>gpt-4o-mini</code></p>
          </div>
        </div>

        <div className="docs-grid">
          <div className="docs-card" style={{ gridColumn: 'span 2' }}>
            <h3>OrderRefundAgent</h3>
            <p>
              <strong>Responsibility:</strong> Handles tracking, order cancellations, and refunds. This agent enforces strict validation rules: it will refuse to run any database query until the user explicitly supplies <strong>both</strong> their Order ID and customer email address.
            </p>
            <p><strong>Model:</strong> <code>gpt-4o-mini</code></p>
          </div>
        </div>
      </section>

      {/* Section 3: Tools & DB */}
      <section>
        <h1>3. Autonomous Tools & Database Integration</h1>
        <p>
          Each agent is given specific toolsets using programmatic schemas. The schemas enforce parameter parameters at compile-time and run-time using <code>Zod</code> schemas. If an agent tries to call a tool, it must format the parameters exactly according to the schema constraints.
        </p>

        <h2>Available Database Operations</h2>
        <div className="docs-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Tool Name</th>
                <th>Parameters</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CatalogAgent</td>
                <td><code>searchProducts</code></td>
                <td><code>query: string</code></td>
                <td>Filter catalog items by name, category, or descriptions.</td>
              </tr>
              <tr>
                <td>CatalogAgent</td>
                <td><code>getProductDetails</code></td>
                <td><code>productId: string</code></td>
                <td>Retrieves comprehensive specifications and current stock count.</td>
              </tr>
              <tr>
                <td>OrderRefundAgent</td>
                <td><code>getOrderStatus</code></td>
                <td><code>orderId: string, email: string</code></td>
                <td>Check status, tracking code, and details of an order.</td>
              </tr>
              <tr>
                <td>OrderRefundAgent</td>
                <td><code>cancelOrder</code></td>
                <td><code>orderId: string, email: string</code></td>
                <td>Cancels an order if it hasn't shipped or delivered.</td>
              </tr>
              <tr>
                <td>OrderRefundAgent</td>
                <td><code>processRefund</code></td>
                <td><code>orderId: string, email: string</code></td>
                <td>Approves and executes a financial refund on delivered/cancelled orders.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Frontend UI/UX Design */}
      <section>
        <h1>4. Frontend Dashboard & Developer Tool</h1>
        <p>
          A key aspect of this project is the interactive user interface, designed to make Agentic AI operations transparent and easy to debug.
        </p>

        <h2>Key UI Elements:</h2>
        <ul>
          <li>
            <strong>Ambient Glow State Indicator:</strong> The header glow transitions smoothly between <strong>blue (Triage)</strong>, <strong>green (Catalog)</strong>, and <strong>purple (Order & Refund)</strong> to indicate which agent currently has control of the session.
          </li>
          <li>
            <strong>Real-time Mock Database Mirror:</strong> The left panel serves as a live window into the database. When the Order & Refund agent cancels an order, the status instantly transitions from <code>Processing</code> to <code>Cancelled</code> in the UI.
          </li>
          <li>
            <strong>Tool Execution Log Feed:</strong> Renders system calls in the chat feed. Developers can inspect exact JSON payloads being exchanged between the AI models and the server tools.
          </li>
        </ul>
      </section>

      {/* Section 5: Setup & Verification */}
      <section>
        <h1>5. Installation & Run Guide</h1>
        <p>Follow these steps to run the complete environment locally:</p>

        <h2>1. Repository Setup & Git Ignore</h2>
        <p>
          A root-level <code>.gitignore</code> is configured to prevent dependency folders, builds, and keys from leaking into version control:
        </p>
        <pre>
{`# Exclude node modules
node_modules/
**/node_modules/

# Exclude compilation and builds
dist/
**/dist/

# Exclude secrets
.env
**/.env`}
        </pre>

        <h2>2. Backend Server Launch</h2>
        <pre>
{`cd backend_clientagents
npm install
cp .env.example .env  # Add your OPENAI_API_KEY
npm run dev`}
        </pre>
        <p>The Express server will start up on <code>http://localhost:5000</code>.</p>

        <h2>3. Frontend Server Launch</h2>
        <pre>
{`cd frontend_react
npm install
npm run dev`}
        </pre>
        <p>Open <code>http://localhost:5173</code> in your browser to interact with the project.</p>
      </section>
    </div>
  );
}
