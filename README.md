# 💰 Expense Tracker - Automatic Email Integration

A modern, beautiful expense management application built with Next.js that automatically reads transaction notification emails and adds expenses to your tracker. Perfect for tracking daily expenses from bank transaction notifications.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-green)

## ✨ Features

- **📧 Automatic Email Parsing**: Reads transaction notification emails (VIB Bank format supported)
- **💰 Expense Management**: Create, read, update, and delete expenses
- **📊 Dashboard Analytics**: View total expenses, top merchants, and category breakdowns
- **🎨 Beautiful UI**: Built with shadcn/ui components and Tailwind CSS
- **✨ Smooth Animations**: Powered by Framer Motion
- **🔄 Real-time Sync**: Manual email sync with one click
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🌙 Dark Mode Ready**: Beautiful in both light and dark themes

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Email Parsing**: IMAP + Mailparser

## 📧 Supported Email Formats

Currently supports **VIB (Vietnam International Bank)** transaction notifications with the following format:

```
Card number: 5138***5758
Cardholder: TRAN CAO KHANG
Transaction: Payment for services and goods
Value: 87,000 VND
At: 01:03 11/17/2025
At Shopee
```

### Adding More Banks

You can easily add parsers for other banks by editing `lib/email-parser.ts`:

```typescript
parseEmail(subject: string, body: string): ParsedExpense | null {
  if (subject.includes('VIB')) return this.parseVIBEmail(subject, body)
  if (subject.includes('Vietcombank')) return this.parseVietcombankEmail(subject, body)
  // Add your bank here
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier works great)
- Email account with IMAP access (Gmail, Outlook, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd saver
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor

   c. Get your project URL and anon key from Settings > API

4. **Configure environment variables**

   Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

   Fill in your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Email (for Gmail, enable "App Passwords" in Google Account settings)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_HOST=imap.gmail.com
   EMAIL_PORT=993
   EMAIL_TLS=true
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Manual Expense Entry

1. Click the "Add Expense" button
2. Fill in the expense details
3. Click "Create" to save

### Automatic Email Sync

1. Ensure your email credentials are configured in `.env`
2. Click the "Sync Emails" button in the dashboard
3. The app will fetch unread transaction emails and automatically create expenses

### Managing Expenses

- **Edit**: Click the "Edit" button on any expense card
- **Delete**: Click the "Delete" button (with confirmation)
- **View Details**: All expense information is displayed on the card

## 📁 Project Structure

```
saver/
├── app/
│   ├── api/
│   │   ├── expenses/        # Expense CRUD endpoints
│   │   ├── email/           # Email sync endpoints
│   │   └── stats/           # Dashboard statistics
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main dashboard
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── expense-card.tsx     # Expense display card
│   ├── expense-form.tsx     # Expense input form
│   ├── stats-card.tsx       # Statistics card
│   └── email-sync-button.tsx # Email sync button
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── email-parser.ts      # Email parsing logic
│   ├── email-service.ts     # IMAP email service
│   └── utils.ts             # Utility functions
├── supabase/
│   └── schema.sql           # Database schema
└── package.json
```

## 🔧 API Endpoints

### Expenses

- `GET /api/expenses` - List all expenses (with filters)
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Email Sync

- `POST /api/email/sync` - Trigger email sync
- `GET /api/email/status` - Get sync status

### Statistics

- `GET /api/stats` - Get dashboard statistics

## 🎨 Customization

### Tailwind Theme

Edit `tailwind.config.ts` to customize colors and styles.

### Components

All UI components are in `components/ui/` and can be customized using the shadcn/ui patterns.

### Email Parser

Add new bank parsers in `lib/email-parser.ts` by creating new parsing methods.

## 🔒 Security Notes

- **Never commit your `.env` file** - it contains sensitive credentials
- **Use app-specific passwords** for email accounts (especially Gmail)
- **Enable Row Level Security (RLS)** in Supabase for production
- **Add authentication** before deploying to production
- **Use HTTPS** in production environments

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Docker

```bash
docker build -t expense-tracker .
docker run -p 3000:3000 --env-file .env expense-tracker
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 To-Do

- [ ] Add user authentication (Supabase Auth)
- [ ] Implement expense categories with icons
- [ ] Add expense charts and visualizations
- [ ] Support for multiple bank formats
- [ ] Export expenses to CSV/Excel
- [ ] Budget tracking and alerts
- [ ] Recurring expense tracking
- [ ] Receipt image uploads
- [ ] Multi-currency support
- [ ] Mobile app (React Native)

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

Made with ❤️ and ☕

For questions or support, please open an issue on GitHub.
