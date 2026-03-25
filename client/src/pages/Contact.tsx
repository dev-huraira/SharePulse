import SimplePage from './SimplePage'

export default function Contact() {
  return (
    <SimplePage title="Contact">
      <p>
        We are available to assist with product questions, transfer issues, and business inquiries.
      </p>

      <h3>Support channels</h3>
      <ul>
        <li>
          <strong>General support:</strong>{' '}
          <a href="mailto:sharepulse.support@gmail.com">sharepulse.support@gmail.com</a>
        </li>
        <li>
          <strong>Technical inquiries:</strong>{' '}
          <a href="mailto:sharepulse.support@gmail.com">sharepulse.support@gmail.com</a>
        </li>
        <li>
          <strong>Partnerships:</strong>{' '}
          <a href="mailto:sharepulse.support@gmail.com">sharepulse.support@gmail.com</a>
        </li>
      </ul>

      <h3>Recommended ticket details</h3>
      <ul>
        <li>Operating system and browser version</li>
        <li>Whether the issue occurred on <strong>Send</strong> or <strong>Receive</strong></li>
        <li>Exact error text and, if possible, a screenshot or short screen recording</li>
        <li>Date/time of issue and any steps that reproduce the problem</li>
      </ul>

      <h3>Response expectation</h3>
      <p>
        We aim to respond to all support emails within <strong>1 business day</strong>. Complex technical issues may
        require additional investigation time.
      </p>

      <h3>Quick troubleshooting</h3>
      <ul>
        <li>Refresh both sender and receiver pages, then retry with a new one-time key.</li>
        <li>Ensure both devices are online and connected to stable networks.</li>
        <li>If transfer setup fails repeatedly, contact support with logs/screenshots.</li>
      </ul>
    </SimplePage>
  )
}

