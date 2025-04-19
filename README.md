## TS-NODE REDIS MONGODB TEMPLATE

#### Deployment

**How To Deploy on Railway**
1. Ensure you have the following services set up:
   - **MongoDB Atlas**: Obtain the connection URL.
   - **Redis**: Obtain the connection URL.

2. Configure your MongoDB Atlas network settings:
   - Add Railway's IP addresses to the network access list, or enable access from all sources (not recommended for production).

3. Deploy the application:
   - Go to [Railway](https://railway.app/) and create a new project.
   - Connect the project to your GitHub repository.
   - Add the required environment variables based on the `.env.example` file:
     - MongoDB connection URL
     - Redis connection URL
     - Any other variables specified in your code.

4. Deploy the project:
   - Once the environment variables are configured, deploy the project directly from Railway.

> **Note:** Ensure that your MongoDB Atlas and Redis services are properly configured to allow read and write access from Railway.

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
