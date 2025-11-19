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

      console.log('Grab email body preview (first 1000 chars):', cleanBody.substring(0, 1000))

      // Skip pending/scheduled orders silently
      if (cleanBody.match(/Total pending|Order for Later|We've got your Order for Later|Đơn hàng đang chờ xử lý/i)) {
        console.log('Skipping pending/scheduled order')
        return null
      }

      // Extract total amount - try multiple patterns
      let amountMatch = null
      let amount = 0

      // Pattern 1: "Tổng cộng ₫38,000" or "Total ₫38000"
      amountMatch = cleanBody.match(/(?:Tổng cộng|Tổng giá|BẠN TRẢ|Total|Grand Total)\s*[:\-]?\s*₫\s*([\d,\.]+)/i)

      // Pattern 2: "38000₫" or "38,000₫"
      if (!amountMatch) {
        amountMatch = cleanBody.match(/(?:Tổng cộng|Tổng giá|BẠN TRẢ|Total|Grand Total)\s*[:\-]?\s*([\d,\.]+)\s*₫/i)
      }

      // Pattern 3: Just find "₫ followed by numbers" as last resort
      if (!amountMatch) {
        amountMatch = cleanBody.match(/₫\s*([\d,\.]+)/i)
      }

      if (!amountMatch) {
        console.error('Could not extract amount from Grab email')
        return null
      }

      // Clean and parse amount - remove commas and dots (Vietnamese number format)
      amount = parseFloat(amountMatch[1].replace(/,/g, '').replace(/\./g, ''))
      console.log('Extracted amount:', amount)

      const currency = 'VND'

      // Extract date - try multiple patterns
      let transactionDate: Date | null = null

      // Pattern 1: "08 Nov 25 18:38" format
      let dateMatch = cleanBody.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})\s+(\d{2}):(\d{2})/i)

      if (dateMatch) {
        const [, day, monthStr, year, hour, minute] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const month = monthMap[monthStr.substring(0, 3)] || '01'
        const fullYear = `20${year}`
        transactionDate = new Date(`${fullYear}-${month}-${day.padStart(2, '0')}T${hour}:${minute}:00+07:00`)
        console.log('Extracted date (pattern 1):', transactionDate.toISOString())
      }

      // Pattern 2: Vietnamese date format "18:38 08/11/2025" or "08/11/2025 18:38"
      if (!transactionDate) {
        dateMatch = cleanBody.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{2}):(\d{2})/i)
        if (dateMatch) {
          const [, day, month, year, hour, minute] = dateMatch
          transactionDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+07:00`)
          console.log('Extracted date (pattern 2):', transactionDate.toISOString())
        }
      }

      // Pattern 3: Time before date "18:38 08/11/2025"
      if (!transactionDate) {
        dateMatch = cleanBody.match(/(\d{2}):(\d{2})\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i)
        if (dateMatch) {
          const [, hour, minute, day, month, year] = dateMatch
          transactionDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+07:00`)
          console.log('Extracted date (pattern 3):', transactionDate.toISOString())
        }
      }

      // If still no date found, use current time
      if (!transactionDate) {
        console.warn('Could not extract date from Grab email, using current time')
        console.log('Searched in body:', cleanBody.substring(0, 500))
        transactionDate = new Date()
      }

      // Extract merchant/store name - try multiple patterns
      let merchant = 'Grab'

      // Pattern 1: "Đặt từ STORE_NAME" or "From STORE_NAME"
      let merchantMatch = cleanBody.match(/(?:Đặt từ|Ordered from|From)\s+([^\n\r]{3,80}?)(?:\s+(?:Giao đến|Delivered to|Được giao|Ngày|Date|₫)|$)/i)

      // Pattern 2: Look for merchant before the amount
      if (!merchantMatch) {
        merchantMatch = cleanBody.match(/([A-Z][^\n\r₫]{5,60}?)\s+(?:Tổng cộng|Total|₫)/i)
      }

      if (merchantMatch) {
        merchant = merchantMatch[1].trim()
        // Clean up merchant name - remove common noise
        merchant = merchant.replace(/\s*Xem chi tiết.*/i, '')
        merchant = merchant.replace(/\s*View details.*/i, '')
        merchant = merchant.replace(/\s*\d+\s*₫.*/, '')
        merchant = merchant.trim()
      }

      console.log('Extracted merchant:', merchant)

      // Extract order code if available
      const orderCodeMatch = cleanBody.match(/(?:Mã đơn hàng|Order code|Order)\s*[:\-]?\s*([A-Z0-9\-]+)/i)
      const orderCode = orderCodeMatch ? orderCodeMatch[1].trim() : ''

      // Determine transaction type based on content
      let transactionType = 'Grab'
      if (cleanBody.toLowerCase().includes('grabfood') || cleanBody.toLowerCase().includes('food')) {
        transactionType = 'GrabFood'
      } else if (cleanBody.toLowerCase().includes('grabmart') || cleanBody.toLowerCase().includes('mart') || cleanBody.toLowerCase().includes('7-eleven')) {
        transactionType = 'GrabMart'
      } else if (cleanBody.toLowerCase().includes('grabcar') || cleanBody.toLowerCase().includes('grabike') || cleanBody.toLowerCase().includes('ride')) {
        transactionType = 'GrabCar/Bike'
      }

      console.log('Parsed Grab values:', { amount, currency, merchant, transactionType, orderCode, date: transactionDate.toISOString() })

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
