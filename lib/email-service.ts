import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { emailParser, ParsedExpense } from './email-parser'

export interface EmailConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
}

export class EmailService {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  /**
   * Fetch unread emails and parse expense information
   * Only processes emails from trusted VIB sender: info@card.vib.com.vn
   */
  async fetchUnreadExpenses(): Promise<ParsedExpense[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
      })

      const expenses: ParsedExpense[] = []
      const TRUSTED_SENDERS = ['info@card.vib.com.vn', 'no-reply@grab.com']

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          // Search for unread emails from trusted senders only
          // Only emails from the last 30 days
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const sinceDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '-')

          // IMAP search criteria: UNSEEN, from trusted senders, since 30 days ago
          const searchCriteria = [
            'UNSEEN',
            ['SINCE', sinceDate],
            ['OR', ...TRUSTED_SENDERS.map(sender => ['FROM', sender])]
          ]

          console.log(`Searching for emails since: ${sinceDate}`)

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (results.length === 0) {
              console.log(`No unread emails from trusted senders: ${TRUSTED_SENDERS.join(', ')}`)
              imap.end()
              resolve([])
              return
            }

            console.log(`Found ${results.length} unread emails from trusted senders`)
            const fetch = imap.fetch(results, { bodies: '' })

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream as any, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err)
                    return
                  }

                  // Double-check sender for security
                  const from = parsed.from?.value?.[0]?.address?.toLowerCase() || ''
                  const isTrustedSender = TRUSTED_SENDERS.some(
                    sender => from === sender.toLowerCase()
                  )

                  if (!isTrustedSender) {
                    console.warn(`Skipping email from untrusted sender: ${from}`)
                    return
                  }

                  console.log(`Processing email from: ${from}`)

                  const subject = parsed.subject || ''
                  const body = parsed.text || parsed.html || ''

                  // Try to parse the email
                  const expense = emailParser.parseEmail(subject, body)
                  if (expense) {
                    console.log(`✓ Parsed expense: ${expense.amount} ${expense.currency} at ${expense.merchant}`)
                    expenses.push(expense)
                  }
                  // Silently skip emails that don't parse (pending orders, confirmations, etc.)
                })
              })
            })

            fetch.once('error', (err) => {
              console.error('Fetch error:', err)
              reject(err)
            })

            fetch.once('end', () => {
              imap.end()
            })
          })
        })
      })

      imap.once('error', (err: Error) => {
        console.error('IMAP error:', err)
        reject(err)
      })

      imap.once('end', () => {
        resolve(expenses)
      })

      imap.connect()
    })
  }

  /**
   * Mark emails as read
   */
  async markAsRead(uids: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
      })

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err)
            return
          }

          imap.addFlags(uids, ['\\Seen'], (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
            imap.end()
          })
        })
      })

      imap.once('error', reject)
      imap.connect()
    })
  }
}

// Create singleton instances for multiple email accounts
let emailServices: EmailService[] | null = null

export function getEmailServices(): EmailService[] {
  if (!emailServices) {
    emailServices = []

    // Primary email account
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      emailServices.push(
        new EmailService({
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD,
          host: process.env.EMAIL_HOST || 'imap.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '993'),
          tls: process.env.EMAIL_TLS === 'true',
        })
      )
    }

    // Secondary email account (optional)
    if (process.env.EMAIL_USER_2 && process.env.EMAIL_PASSWORD_2) {
      emailServices.push(
        new EmailService({
          user: process.env.EMAIL_USER_2,
          password: process.env.EMAIL_PASSWORD_2,
          host: process.env.EMAIL_HOST_2 || 'imap.gmail.com',
          port: parseInt(process.env.EMAIL_PORT_2 || '993'),
          tls: process.env.EMAIL_TLS_2 === 'true',
        })
      )
    }
  }
  return emailServices
}

// Backward compatibility - returns first email service
export function getEmailService(): EmailService {
  const services = getEmailServices()
  if (services.length === 0) {
    throw new Error('No email services configured')
  }
  return services[0]
}
