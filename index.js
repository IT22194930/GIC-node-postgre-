const express = require("express");
const userRoutes = require('./routes/User/UserRoutes');
const port = process.env.PORT || 3001;

const app = express();
app.use(express.json());

// Use user routes
app.use('/api/users', userRoutes);

app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
})