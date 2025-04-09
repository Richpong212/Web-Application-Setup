## log into the docker container and access the database

docker exec -it property-management-db bash
psql -U appuser -d securepassword
