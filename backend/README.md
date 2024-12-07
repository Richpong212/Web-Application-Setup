setting back nodejs backend with typescript

run npm init typescript
follow the prompt to the following values
question name (backend):
question version (1.0.0):
question description:
question entry point (index.js): index.ts
question repository url:
question author:
question license (MIT):
question private:

This will configure the typescript and eslint for the backend

Open the tslint.json file to configure the linting for code quality

{
"extends": "tslint:latest",
"rules": {
"no-console": false,
"quotemark": [true, "double", "avoid-escape"],
"semicolon": [true, "always"],
"trailing-comma": [
true,
{
"multiline": "always",
"singleline": "never"
}
],
"max-line-length": [true, 120],
"object-literal-sort-keys": false,
"ordered-imports": false,
"no-consecutive-blank-lines": false,
"no-trailing-whitespace": false,
"no-empty": false,
"no-implicit-dependencies": false,
"no-unnecessary-type-assertion": false,
"no-unnecessary-callback-wrapper": false,
"no-unnecessary-qualifier": false,
"no-unnecessary-class": false,
"no-unnecessary-initializer": false,
"no-unnecessary-override": false,
"no-unnecessary-type-annotation": false,
"no-unnecessary-else": false,
"no-unnecessary-semicolons": false,
"no-unnecessary-bind": false,
"no-unnecessary-field-initialization": false,
"no-unnecessary-local-variable": false,
"no-unnecessary-boolean-literal-compare": false,
"no-unnecessary-generics": false,
"no-unnecessary-type-arguments": false
}
}

Run yarn lint to lint run linting for the codebase

open the src folder from cmd and add the following folders
mkdir routes services controllers utils config - for necessary folders and can be upgraded as needed.

now lets make two files for defining and keeping track of all our application requirements

in the backend folder:
run touch requirements.txt && touch dev-requirements.txt

list all the core dependencies for the application in requirements.txt and the development dependencies in dev-requirements.
dev-requirement.txt
morgan
@types/morgan
winston
@types/winston
dotenv
@types/dotenv
@types/express
@types/cors
helmet
@types/helmet
express-validator
@types/express-validator
express-rate-limit
@types/express-rate-limit

requirement.txt
express
cors

open package.json and configure a script to run once to install the dependencies
add this following to the script section
"packages": "yarn add $(cat requirements.txt) && yarn add -D $(cat dev-requirements.txt)"

Run the following command to install the packages
yarn packages

Add the following to the script section to start the application in production mode
"start": "NODE_ENV=production node ./lib/index.js"

Add the following to the script section to start the application in Development mode
"dev": "NODE_ENV=development nodemon ./src/index.ts"

inside the utils folder create a filer called logger.ts for logging the application
import winston from "winston";
// Logger configuration
export const logger = winston.createLogger({
level: "info",
format: winston.format.json(),
transports: [
new winston.transports.Console({
format: winston.format.combine(
winston.format.colorize(),
winston.format.simple()
),
}),
new winston.transports.File({
filename: "logs/app.log",
level: "info",
}),
],
});

configure the index.ts file to start the application

import express, { Request, Response, Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { logger } from "./utils/logger";

const app: Application = express();

//API Rate limiting
const limiter = rateLimit({
windowMs: 15 _ 60 _ 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per windowMs
message: "Too many requests, please try again later",
});

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(morgan("combined"));

//Base route
app.get("/", (\_req: Request, res: Response) => {
res.status(200).json({
message: "Welcome to the API",
});
});

//Routes
const port = 3000;

app.listen(port, () => {
logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
