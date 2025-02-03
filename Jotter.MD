# Complete Full-Stack Application Setup: Best Practices for Scalable Web Development

First in the root of the project [Web-App-Settup] let us create the following folders to hold the frontend, backend of the application. We also need to make a docker compose file so setup the configuration for the development setup in production env. Tech Stack: React, Nodejs, Postgres

Prerequiresite:
Install docker and docker compose on your system
install nodejs 20+
install typescript globally

Step1: Creating the files from the CLI, you can also just create it manually but I find the cli to be faster and managing files and folders.
mkdir frontend backend

step2: Creating a docker compose file for setting up all the configuration for our project setup. We will first initialize the databse and memcached from the docker compose file. Create the file from the cli in the root directory by running the following:
touch docker-compose.yml;

step3: Let us configure the database using the docker compose file
Run the docker compose up to setup the database running .
Login to the docker container with the db cred. to virify setup

docker exec -it postgresDB psql -U webapp -d webappDB

run ctr + c to stop the container from running and let us proceed to setting up the backend.

We build the application from the backend just as we do serve from the kitchen.

step4: Backend setup, let us setup a nodejs application for the backend, production grade style.
Open terminal in the backend folder.
Setting up the nodejs app:
ensure you have installed node
npm init -y
create a file called requirement.txt and requirement-dev.txt inside the backend folder
requirement.txt: all app dependencies here for managing; requirement-dev: for development managing
Update the package.json file to have one command to install all the needed modules.
update the script section with this comman
"scripts": {
"dev-install": "yarn add $(cat requirement.txt) && yarn add $(cat dev-requirement.txt) --dev"
},
then run yarn dev-install to make all the installations.

4.1 lets make src folder inside the backend folder to hold all our application code.
mkdir src
4.2 inside the src folder lets create all required folders for the application
cd src; mkdir config controllers routes middlewares services utils; touch index.ts

## CONTINUE WITH BLOG

# 4.3 make the initial setup for the application using express in the index.ts file.

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

# 4.4 configure nodemon to run the test the application.

# 4.5: Let us configure eslint

run: yarn create @eslint/config
follow the promt and choose the following settings

kwakurich@Kwakus-MacBook-Pro backend % yarn create @eslint/config
yarn create v1.22.22
[1/4] 🔍 Resolving packages...
[2/4] 🚚 Fetching packages...
[3/4] 🔗 Linking dependencies...
[4/4] 🔨 Building fresh packages...

success Installed "@eslint/create-config@1.4.0" with binaries: - create-config
[#################################################################################################] 97/97@eslint/create-config: v1.4.0

✔ How would you like to use ESLint? · problems
✔ What type of modules does your project use? · esm
✔ Which framework does your project use? · none
✔ Does your project use TypeScript? · typescript
✔ Where does your code run? · node
The config that you've selected requires the following dependencies:

eslint, globals, @eslint/js, typescript-eslint
✔ Would you like to install them now? · No / Yes
✔ Which package manager do you want to use? · yarn
☕️Installing...

# 4.6 Update the package.json with eslint configuration

install concurrently chokidar-cli for running the eslint concurrently
