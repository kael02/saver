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
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Parse VIB (Vietnam International Bank) transaction notification email
   * Supports both English and Vietnamese formats
   */
  parseVIBEmail(subject: string, body: string): ParsedExpense | null {
    try {
      // Strip HTML if present
      const cleanBody = this.stripHtml(body)

      console.log('Cleaned body preview:', cleanBody.substring(0, 800))

      // Extract card number (Vietnamese: Số thẻ OR English: Card number)
      const cardNumberMatch = cleanBody.match(/(?:Số thẻ|Card number):\s*[<>]*\s*(\d+\*+\d+)/i)
      const cardNumber = cardNumberMatch ? cardNumberMatch[1].trim() : ''

      // Extract cardholder name (Vietnamese: Chủ thẻ OR English: Cardholder)
      const cardholderMatch = cleanBody.match(/(?:Chủ thẻ|Cardholder):\s*[<>]*\s*([A-Z\s]+?)(?:\s*Giao dịch|\s*Transaction|<)/i)
      const cardholder = cardholderMatch ? cardholderMatch[1].trim() : ''

      // Extract transaction type (Vietnamese: Giao dịch OR English: Transaction)
      const transactionMatch = cleanBody.match(/(?:Giao dịch|Transaction):\s*[<>]*\s*([^<]+?)(?:\s*Giá trị|\s*Value|<)/i)
      const transactionType = transactionMatch ? transactionMatch[1].trim() : ''

      // Extract amount and currency (Vietnamese: Giá trị OR English: Value)
      const valueMatch = cleanBody.match(/(?:Giá trị|Value):\s*[<>]*\s*([\d,\.]+)\s*([A-Z]{3})/i)
      if (!valueMatch) {
        console.error('Could not extract amount from email')
        console.error('Looking for pattern in:', cleanBody.substring(0, 1000))
        return null
      }

      const amount = parseFloat(valueMatch[1].replace(/,/g, '').replace(/\./g, ''))
      const currency = valueMatch[2]

      // Extract date and time (Vietnamese: Vào lúc OR English: At)
      const dateMatch = cleanBody.match(/(?:Vào lúc|At):\s*[<>]*\s*(\d{2}:\d{2})\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)
      if (!dateMatch) {
        console.error('Could not extract date from email')
        return null
      }

      const time = dateMatch[1]
      const date = dateMatch[2]
      const [day, month, year] = date.split('/')
      const transactionDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`)

      // Extract merchant (Vietnamese: Tại OR English: At)
      // Look for the merchant name after "Tại" or "At"
      const merchantMatch = cleanBody.match(/(?:Tại|At)\s+[<>]*\s*([^\n<]+?)(?:\s*Để biết|For more|Email|Địa chỉ|<|$)/i)
      let merchant = 'Unknown'
      if (merchantMatch) {
        merchant = merchantMatch[1].trim() || 'Unknown'
      }

      console.log('Parsed values:', { cardNumber, cardholder, transactionType, amount, currency, merchant })

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
   * Parse Grab transaction notification email
   */
  parseGrabEmail(subject: string, body: string): ParsedExpense | null {
    try {
      // Strip HTML if present
      const cleanBody = this.stripHtml(body)

      console.log('Parsing Grab email...')
      console.log('Cleaned body preview:', cleanBody.substring(0, 800))

      // Grab emails typically contain trip/order details
      // This is a placeholder - needs actual Grab email format
      // TODO: Update with actual Grab email format after testing

      console.error('Grab email parser not yet implemented')
      console.log('Please provide a sample Grab email for parser implementation')
      return null
    } catch (error) {
      console.error('Error parsing Grab email:', error)
      return null
    }
  }

  /**
   * Main parser function - detects service and routes to appropriate parser
   */
  parseEmail(subject: string, body: string): ParsedExpense | null {
    const subjectLower = subject.toLowerCase()
    const bodyLower = body.toLowerCase()

    // Check for Grab email
    if (
      subjectLower.includes('grab') ||
      bodyLower.includes('grab') ||
      bodyLower.includes('no-reply@grab.com')
    ) {
      console.log('Detected Grab email format, attempting to parse...')
      return this.parseGrabEmail(subject, body)
    }

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

    // Add more parsers here
    // if (subject.includes('Vietcombank')) return this.parseVietcombankEmail(subject, body)
    // if (subject.includes('Techcombank')) return this.parseTechcombankEmail(subject, body)

    console.log('Unknown email format - does not match known patterns')
    return null
  }
}

export const emailParser = new EmailParser()
