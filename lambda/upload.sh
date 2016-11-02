#!/bin/bash

zip -r aws/lambda.zip . -x aws/*

echo
echo "uploading"
aws lambda update-function-code --zip-file fileb://aws/lambda.zip --cli-input-json file://aws/update-function-code.json --region us-east-1 $AWS
