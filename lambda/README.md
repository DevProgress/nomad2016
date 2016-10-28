# AWS Lambda function to get data from airtable

Data for this project is in https://airtable.com but their spreadsheet-like UI doesn't support some of the queries we need.  While airtable has an API, they only provide one full-access API key.  This function proxies the API through an AWS Lambda function and API to provide read-only access

API URL is https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable

## people

add `table=people` to the URL

returns JSON:

    {
        "people": [
            {
                "start": "2016-11-05",
                "return": "2016-11-08",
                "id": "recY5xsP6WoZmLIld",
                "email": "email@user.com"
            },
            ...
        ]
    }
