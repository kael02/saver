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
      const TRUSTED_SENDER = 'info@card.vib.com.vn'

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          // Search for unread emails from VIB only
          imap.search(['UNSEEN', ['FROM', TRUSTED_SENDER]], (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (results.length === 0) {
              console.log(`No unread emails from ${TRUSTED_SENDER}`)
              imap.end()
              resolve([])
              return
            }

            console.log(`Found ${results.length} unread emails from ${TRUSTED_SENDER}`)
            const fetch = imap.fetch(results, { bodies: '' })

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err)
                    return
                  }

                  // Double-check sender for security
                  const from = parsed.from?.value?.[0]?.address?.toLowerCase() || ''
                  if (from !== TRUSTED_SENDER.toLowerCase()) {
                    console.warn(`Skipping email from untrusted sender: ${from}`)
                    return
                  }

                  const subject = parsed.subject || ''
                  const body = parsed.text || ''

                  // Try to parse the email
                  const expense = emailParser.parseEmail(subject, body)
                  if (expense) {
                    console.log(`Parsed expense: ${expense.amount} ${expense.currency} at ${expense.merchant}`)
                    expenses.push(expense)
                  } else {
                    console.log('Email from VIB but could not parse expense data')
                  }
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

      imap.once('error', (err) => {
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

// Create singleton instance
let emailService: EmailService | null = null

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService({
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      host: process.env.EMAIL_HOST || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '993'),
      tls: process.env.EMAIL_TLS === 'true',
    })
  }
  return emailService
}
