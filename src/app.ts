import express from 'express';
import cors from 'cors';
import helloRoute from './routes/hello.route';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hello', helloRoute);

export default app;
