import express from 'express';
import cors from 'cors';
import membersRoute from './routes/members';
import userRoutes from "./routes/userRoute";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRoute);
app.use('/api/documents', membersRoute);
app.use("/api/users", userRoutes);

export default app;
