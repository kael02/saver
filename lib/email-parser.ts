export interface ParsedExpense {
  cardNumber: string
  cardholder: string
  transactionType: string
  amount: number
  currency: string
  transactionDate: string
  merchant: string
  source: 'email'
  emailSubject: string
}

export class EmailParser {
  /**
   * Parse VIB (Vietnam International Bank) transaction notification email
   */
  parseVIBEmail(subject: string, body: string): ParsedExpense | null {
    try {
      // Extract card number
      const cardNumberMatch = body.match(/Card number:\s*(\d+\*+\d+)/i)
      const cardNumber = cardNumberMatch ? cardNumberMatch[1] : ''

      // Extract cardholder name
      const cardholderMatch = body.match(/Cardholder:\s*([^\n]+)/i)
      const cardholder = cardholderMatch ? cardholderMatch[1].trim() : ''

      // Extract transaction type
      const transactionMatch = body.match(/Transaction:\s*([^\n]+)/i)
      const transactionType = transactionMatch ? transactionMatch[1].trim() : ''

      // Extract amount and currency
      const valueMatch = body.match(/Value:\s*([\d,]+)\s*([A-Z]+)/i)
      if (!valueMatch) {
        console.error('Could not extract amount from email')
        return null
      }

      const amount = parseFloat(valueMatch[1].replace(/,/g, ''))
      const currency = valueMatch[2]

      // Extract date and time
      const dateMatch = body.match(/At:\s*(\d{2}:\d{2})\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)
      if (!dateMatch) {
        console.error('Could not extract date from email')
        return null
      }

      const time = dateMatch[1]
      const date = dateMatch[2]
      const [day, month, year] = date.split('/')
      const transactionDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`)

      // Extract merchant
      const merchantMatch = body.match(/At\s+([^\n]+?)(?:\s*For more information|$)/is)
      let merchant = 'Unknown'
      if (merchantMatch) {
        const merchantText = merchantMatch[1].trim()
        const lines = merchantText.split('\n')
        merchant = lines[lines.length - 1].trim() || 'Unknown'
      }

      return {
        cardNumber,
        cardholder,
        transactionType,
        amount,
        currency,
        transactionDate: transactionDate.toISOString(),
        merchant,
        source: 'email',
        emailSubject: subject,
      }
    } catch (error) {
      console.error('Error parsing VIB email:', error)
      return null
    }
  }

  /**
   * Main parser function - detects bank and routes to appropriate parser
   */
  parseEmail(subject: string, body: string): ParsedExpense | null {
    const subjectLower = subject.toLowerCase()
    const bodyLower = body.toLowerCase()

    // Check for VIB email - multiple possible indicators
    if (
      subjectLower.includes('vib') ||
      bodyLower.includes('vietnam international bank') ||
      bodyLower.includes('vib online') ||
      bodyLower.includes('card.vib.com.vn') ||
      bodyLower.includes('card number:') // Common in transaction emails
    ) {
      console.log('Detected VIB email format, attempting to parse...')
      return this.parseVIBEmail(subject, body)
    }

    // Add more bank parsers here
    // if (subject.includes('Vietcombank')) return this.parseVietcombankEmail(subject, body)
    // if (subject.includes('Techcombank')) return this.parseTechcombankEmail(subject, body)

    console.log('Unknown email format - does not match VIB patterns')
    return null
  }
}

export const emailParser = new EmailParser()
