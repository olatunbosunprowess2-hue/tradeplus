# TradePlus 🔄

A modern, revolutionary marketplace platform that enables users to buy, sell, and trade items using cash, barter, or a combination of both. Built with cutting-edge web technologies for a seamless trading experience.

![TradePlus Banner](https://via.placeholder.com/1200x300/667eea/ffffff?text=TradePlus+Marketplace)

## ✨ Features

### Trading Flexibility
- **💵 Cash Payments** - Traditional buying and selling with secure payment options
- **🔄 Barter System** - Exchange items without spending money
- **💎 Hybrid Deals** - Combine cash and items for maximum flexibility

### User Experience
- **🎨 Dynamic Animations** - Smooth, engaging UI with modern animations
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **🔔 Real-time Notifications** - Stay updated on offers and messages
- **💬 Integrated Messaging** - Communicate directly with buyers and sellers
- **⭐ User Verification** - Phone verification for trusted transactions
- **📊 Admin Dashboard** - Comprehensive platform management

### Platform Features
- User profile management with verification badges
- Listing creation with multiple images
- Offer system for negotiations
- Wants list to find desired items
- Report system for safety
- Advanced search and filtering

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components with animations

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **File Upload**: Cloudinary integration

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Phone Verification**: Twilio (configured for production)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/TradePlus.git
   cd TradePlus
   ```

2. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` file in the root:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/tradeplus?schema=public
   JWT_SECRET=super-secret-jwt-key
   JWT_REFRESH_SECRET=super-secret-refresh-key
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development servers**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://localhost:3000
   - **API Docs**: http://localhost:3000/api

### Default Admin Account
- **Email**: admin@tradeplus.com
- **Password**: password123

## 📁 Project Structure

```
TradePlus/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/     # Authentication module
│   │   │   ├── listings/ # Listings management
│   │   │   ├── offers/   # Offer system
│   │   │   ├── users/    # User management
│   │   │   └── ...
│   │   └── package.json
│   └── web/              # Next.js frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       ├── lib/          # Utilities & stores
│       └── package.json
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml    # Docker services
├── package.json          # Root package.json
└── README.md
```

## 🎯 Available Scripts

```bash
# Development
npm run dev           # Start both frontend and backend
npm run dev:web       # Start frontend only
npm run dev:api       # Start backend only

# Database
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database

# Build
npm run build         # Build both apps
npm run build:web     # Build frontend
npm run build:api     # Build backend
```

## 🔐 Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Optional Variables (Production)
- `CLOUDINARY_CLOUD_NAME` - For image uploads
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `TWILIO_ACCOUNT_SID` - For phone verification
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## 🎨 Key Features in Detail

### Dynamic Homepage
- Animated hero section with eye-catching CTAs
- Scroll-triggered counting animations for stats
- Interactive feature cards with hover effects
- Responsive design optimized for all devices

### User Authentication
- Secure JWT-based authentication
- Phone number verification
- Refresh token rotation
- Password reset functionality

### Listing Management
- Multi-image upload support
- Flexible payment options (cash, barter, hybrid)
- Category-based organization
- Advanced search and filtering

### Messaging System
- Real-time chat between users
- Offer proposals and negotiations
- Message notifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Your Name - [@YourGitHub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and NestJS
- Icons and animations powered by Tailwind CSS
- Database management with Prisma

---

⭐ Star this repo if you find it helpful!
