zip_file = ../lambda.zip

all: install

dist:
	zip -r $(zip_file) .

install: dist
	aws --region us-west-2 lambda update-function-code \
		--function-name alexaMySmartHomeSkill \
		--zip-file fileb://$(zip_file) \
		--publish

clean:
	rm -rf $(zip_file)