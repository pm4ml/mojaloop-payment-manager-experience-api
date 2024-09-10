u# mojaloop-payment-manager-experience-api
Experience API serving UI in Mojaloop Payment Manager

## Run the service locally as a docker container
1. Build the docker image: docker build -t modusintegration/mojaloop-payment-manager-experience-api .

2. Running the container: docker run -it -p 3000:3000 -e MOCK_DATA=true modusintegration/mojaloop-payment-manager-experience-api

## Test the service locally:
In test/contract_tests folder there is a postman collection that tests all the endpoints in the api.

To test the scripts in the collection, you need to set EXPERIENCE_API_ENDPOINT environment variable in the postman environment file to localhost:3000

## Mapping between UI Screens and Experience API endpoints

