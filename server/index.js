const express = require("express");
const cors = require("cors");
const path = require("path");

const userRoutes = require('./routes/User/UserRoutes');
const OrganizationRoutes = require('./routes/Organization/organizationRoutes');
const serviceRoutes = require('./routes/Service/serviceRoutes');

const port = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

// Mount your API routes
app.use('/api/users', userRoutes);
app.use('/api/organizations', OrganizationRoutes);
app.use('/api/services', serviceRoutes);

// 🔹 Serve generated PDFs (and any other files) from server/generated-docs
app.use(
  '/generated-docs',
  express.static(path.join(__dirname, 'generated-docs'))
);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
