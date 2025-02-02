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
touch src
4.2 inside the src folder lets create all required folders for the application
