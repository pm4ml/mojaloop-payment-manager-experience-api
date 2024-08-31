.PHONY: build run

NAME = mojaloop-payment-manager-experience-api


default: build

build:
	docker build -t $(NAME) .
run:
	docker run --rm -p 3000:3000 -e MOCK_DATA=true --name $(NAME) $(NAME)
