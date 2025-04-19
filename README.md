## TS-NODE REDIS MONGODB TEMPLATE

#### Deployment

The application is deployed at:
[Here](https://ts-mongose-template-production.up.railway.app/)

To test the health check endpoint, visit:
[Health Check Endpoint](https://ts-mongose-template-production.up.railway.app/api/v1/health)

#### Development

1. Ensure you are using **Node.js v18 or higher**.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by following the `.env.example` file.
4. Make sure **MongoDB** and **Redis** services are running before starting development.
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Alternatively, you can use Docker Compose for development, make sure `.env.development` exist on your root directory:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

> **Note:** Ensure that your `.env` file is properly configured to avoid runtime issues.



#### Testing

To run tests, use the following command:
```bash
npm test
```
or if you need test using postman can use this file``TS-NODE-API.postman_collection.json``

#### Project Structure

```
/app
  ├── controllers/    # Define request handlers
  ├── entities/       # Mongoose models
  ├── routes/         # API routes
  ├── utils/          # Utility functions
  ├── middleware/     # Express middleware
  ├── config/         # Configuration files
  └── index.ts        # Application entry point
```

#### Tech Stack

- **Node.js**: Backend runtime
- **TypeScript**: Type safety and modern JavaScript features
- **MongoDB**: NoSQL database
- **Redis**: In-memory data store
- **Mongoose**: MongoDB object modeling
- **Railway**: Deployment platform

> **Tip:** For more information about the tech stack, refer to their official documentation.
