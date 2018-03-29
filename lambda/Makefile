distfile = lambda.zip

all: dist

dist: clean
	zip -r $(distfile) *
	aws --region us-west-2 lambda update-function-code --function-name alexaMySmartHomeSkill --zip-file fileb://$(distfile) --publish

clean:
	rm -f $(distfile)
