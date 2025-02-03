import express from "express";
import { Request, Response } from "express";

const app = express();

const port = 5004;

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello from the backend!" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
