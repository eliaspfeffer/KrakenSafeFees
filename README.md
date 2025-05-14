# ShipFast — Javascript

Hey maker 👋 it's Marc from [ShipFast](https://shipfa.st/docs). Let's get your startup off the ground, FAST ⚡️

<sub>**Watch/Star the repo to be notified when updates are pushed**</sub>

## Start Server via Shell Script:

     ./krakensafefees.sh start
     ./krakensafefees.sh status

### View the latest log entries:

     tail -f ~/Documents/Github/krakensafefees/dev-server.log

     ./krakensafefees.sh stop
     ./krakensafefees.sh restart

## Get Started

1. Follow the [Get Started Tutorial](https://shipfa.st/docs) to clone the repo and run your local server 💻

<sub>**Looking for the /pages router version?** Use this [documentation](https://shipfa.st/docs-old) instead</sub>

2. Follow the [Ship In 5 Minutes Tutorial](https://shipfa.st/docs/tutorials/ship-in-5-minutes) to learn the foundation and ship your app quickly ⚡️

## Kraken API Integration

This project contains an implementation for displaying the Kraken account balance in the dashboard. The integration allows users, after storing their Kraken API keys, to view their Bitcoin and Euro balances in the dashboard.

### Features

- Display of Euro balance
- Display of Bitcoin balance (in BTC and EUR)
- Display of the current Bitcoin price
- Calculation of the total portfolio value
- Secure storage and use of API keys
- Fallback mode for development

### Detailed Documentation

You can find detailed documentation of the Kraken API integration here:
[Kraken API Integration Documentation](./docs/KRAKEN_API_INTEGRATION.md)

## Installation and Configuration

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Kraken account with API keys

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/krakensafefees.git
   cd krakensafefees
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   - Copy the example environment file: `cp .env.template .env.local`
   - Edit the `.env.local` file and add your own values:

   ```
   # Auth
   NEXTAUTH_SECRET=your-nextauth-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # Encryption key (MUST be exactly 32 bytes long)
   ENCRYPTION_KEY=your-32-byte-encryption-key-here12

   # Cron Jobs
   CRON_SECRET=your-cron-secret-here

   # Admin Configuration
   ADMIN_EMAIL=your-admin-email@example.com
   ```

   > **IMPORTANT:** The ENCRYPTION_KEY must be exactly 32 bytes long, as it is used for AES-256 encryption of the Kraken API keys.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. For production builds:
   ```bash
   npm run build
   npm start
   ```

### Security Notes

- Generate a strong, random `ENCRYPTION_KEY` that is exactly 32 bytes long
- Never store real API keys directly in the code or in version-controlled files
- For Kraken API keys, only use the necessary permissions (Query funds, Trading)
- A `.gitignore` is configured to exclude `.env.local` and other sensitive files

## Contributions

Contributions are welcome! Please read `CONTRIBUTING.md` for more details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [📚 Documentation](https://shipfa.st/docs)
- [📣 Updates](https://shipfast.beehiiv.com/)
- [🧑‍💻 Discord](https://shipfa.st/dashboard)
- [🥇 Leaderboard](https://shipfa.st/leaderboard)

## Support

Reach out at hello@shipfa.st

Let's ship it, FAST ⚡️

\_

**📈 Grow your startup with [DataFast](https://datafa.st?ref=shipfast_readme)**

- Analyze your traffic
- Get insights on your customers
- Make data-driven decisions

ShipFast members get 30% OFF on all plans! 🎁

![datafast](https://github.com/user-attachments/assets/085453a6-8a66-45be-b7ea-a7a08e856ed8)
