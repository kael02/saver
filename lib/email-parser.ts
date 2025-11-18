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
   * Parse Grab transaction notification email (GrabFood, GrabMart, GrabCar, etc.)
   */
  parseGrabEmail(subject: string, body: string): ParsedExpense | null {
    try {
      // Strip HTML if present
      const cleanBody = this.stripHtml(body)

      console.log('Parsing Grab email...')
      console.log('Cleaned body preview:', cleanBody.substring(0, 800))

      // Extract total amount (Vietnamese: Tổng giá OR Tổng cộng OR BẠN TRẢ)
      // Support both formats: "₫ 88000" and "24400₫"
      let amountMatch = cleanBody.match(/(?:Tổng giá|Tổng cộng|BẠN TRẢ|Total)\s*[<>]*\s*(?:₫\s*)?([\d,\.]+)\s*₫/i)

      // Fallback to format with ₫ before amount
      if (!amountMatch) {
        amountMatch = cleanBody.match(/(?:Tổng giá|Tổng cộng|BẠN TRẢ|Total)\s*[<>]*\s*₫\s*([\d,\.]+)/i)
      }

      if (!amountMatch) {
        console.error('Could not extract amount from Grab email')
        return null
      }

      const amount = parseFloat(amountMatch[1].replace(/,/g, '').replace(/\./g, ''))
      const currency = 'VND'

      // Extract delivery/completion time (Vietnamese: Giao đến lúc OR Ngày | Giờ)
      // Format: "01 Oct 22 07:44 +0700" or "Giao đến lúc 01 Oct 22 07:44" or "Ngày | Giờ 08 Nov 25 18:38"
      const dateMatch = cleanBody.match(/(?:Giao đến lúc|Delivered at|Completed at|Ngày\s*\|\s*Giờ)\s*[<>]*\s*(\d{2})\s+(\w{3})\s+(\d{2})\s+(\d{2}):(\d{2})/i)

      let transactionDate: Date
      if (dateMatch) {
        const [, day, monthStr, year, hour, minute] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const month = monthMap[monthStr] || '01'
        const fullYear = `20${year}`
        transactionDate = new Date(`${fullYear}-${month}-${day.padStart(2, '0')}T${hour}:${minute}:00`)
      } else {
        // Default to now if can't parse date
        console.warn('Could not extract date from Grab email, using current time')
        transactionDate = new Date()
      }

      // Extract merchant/store name (Vietnamese: Đặt từ)
      const merchantMatch = cleanBody.match(/(?:Đặt từ|Ordered from|From)\s*[<>]*\s*([^\n]+?)(?:\s*Giao đến|Delivered to|Được giao|$)/i)
      let merchant = 'Grab'
      if (merchantMatch) {
        merchant = merchantMatch[1].trim() || 'Grab'
      }

      // Extract order code if available
      const orderCodeMatch = cleanBody.match(/(?:Mã đơn hàng|Order code)\s*[<>]*\s*([A-Z0-9\-]+)/i)
      const orderCode = orderCodeMatch ? orderCodeMatch[1].trim() : ''

      // Determine transaction type based on content
      let transactionType = 'Grab'
      if (cleanBody.toLowerCase().includes('grabfood')) {
        transactionType = 'GrabFood'
      } else if (cleanBody.toLowerCase().includes('grabmart') || cleanBody.toLowerCase().includes('7-eleven')) {
        transactionType = 'GrabMart'
      } else if (cleanBody.toLowerCase().includes('grabcar') || cleanBody.toLowerCase().includes('grabike')) {
        transactionType = 'GrabCar/Bike'
      }

      console.log('Parsed Grab values:', { amount, currency, merchant, transactionType, orderCode })

      return {
        cardNumber: orderCode || 'Grab',
        cardholder: 'Grab User',
        transactionType,
        amount,
        currency,
        transactionDate: transactionDate.toISOString(),
        merchant,
        source: 'email',
        emailSubject: subject,
      }
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
