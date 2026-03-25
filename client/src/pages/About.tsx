import SimplePage from './SimplePage'

export default function About() {
  return (
    <SimplePage title="About">
      <p>
        SharePulse is a secure, real-time file transfer platform designed for fast person-to-person sharing with minimal
        friction. Users generate a <strong>6-digit one-time key</strong> to establish a direct transfer session between
        sender and receiver.
      </p>

      <h3>Our approach</h3>
      <ul>
        <li>
          <strong>Simple onboarding</strong>: no account is required for basic transfers.
        </li>
        <li>
          <strong>Real-time coordination</strong>: sender and receiver connection states are synchronized live.
        </li>
        <li>
          <strong>One-time access</strong>: each transfer key is short-lived and invalid after completion.
        </li>
      </ul>

      <h3>Transfer workflow</h3>
      <ul>
        <li>
          <strong>Step 1:</strong> Sender selects a file and receives a 6-digit key.
        </li>
        <li>
          <strong>Step 2:</strong> Receiver enters the key and joins the transfer session.
        </li>
        <li>
          <strong>Step 3:</strong> File is transferred peer-to-peer with progress tracking and completion confirmation.
        </li>
      </ul>

      <h3>Security baseline</h3>
      <ul>
        <li>
          Transfer keys are <strong>one-time use</strong> and expire by default after <strong>10 minutes</strong>.
        </li>
        <li>
          Signaling is validated on the backend before session setup.
        </li>
        <li>
          For production deployments, we recommend adding authentication, abuse protection, audit logging, and managed
          TURN infrastructure.
        </li>
      </ul>

      <p>
        Our goal is to deliver an intuitive transfer experience with modern UX, reliable connection handling, and a clean
        architecture that can scale from demo to production-ready foundations.
      </p>
    </SimplePage>
  )
}

