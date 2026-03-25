import SimplePage from './SimplePage'

export default function Privacy() {
  return (
    <SimplePage title="Privacy">
      <p>
        SharePulse is designed for temporary, session-based file transfers. This Privacy Policy explains what information
        is processed, how it is used, and how long it is retained.
      </p>

      <h3>Information we process</h3>
      <ul>
        <li>
          <strong>Transfer metadata</strong>: file name, file size, MIME type, transfer status, and expiration timestamp.
        </li>
        <li>
          <strong>Session key</strong>: a 6-digit one-time code used to match sender and receiver.
        </li>
        <li>
          <strong>Connection signaling data</strong>: session negotiation messages required to establish peer-to-peer
          transfer.
        </li>
      </ul>

      <h3>How transfers work</h3>
      <p>
        File content is transferred directly between participants through peer-to-peer channels. The server coordinates
        session setup and validation but is not intended to permanently store transferred files.
      </p>

      <h3>Retention</h3>
      <ul>
        <li>
          One-time session keys expire automatically after the configured transfer window.
        </li>
        <li>
          Transfer metadata is removed after completion or expiration, subject to operational requirements.
        </li>
      </ul>

      <h3>Data security</h3>
      <ul>
        <li>Session validation is required before signaling begins.</li>
        <li>One-time key logic reduces reuse risk for completed transfers.</li>
        <li>Production deployments should add enterprise controls (access policies, auditing, and managed relay).</li>
      </ul>

      <p>
        If legal or compliance requirements apply in your region, this policy should be reviewed and adapted to your
        organization’s obligations before public launch.
      </p>
    </SimplePage>
  )
}

