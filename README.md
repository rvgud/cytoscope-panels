## Getting started

### Frontend

1. Install dependencies

   ```bash
   npm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   npm run dev
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Spin up a Grafana instance and run the plugin inside it (using Docker)


   ```bash
   docker compose up
   ```
5. Publish Git Release

   ```bash
   git tag <tagname>
   git push origin <tagname>
   ```