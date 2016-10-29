# AWS Lambda function to get data from airtable

Data for this project is in https://airtable.com but their spreadsheet-like UI doesn't support some of the queries we need.  While airtable has an API, they only provide one full-access API key.  This function proxies the API through an AWS Lambda function and API to provide read-only access

API URL is https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable


## requirements

1) As a field organizer, I want to be able to pull a list of email addresses for everyone who is going to be arriving in X city on Y date. (Y date is "start date")

2) As a field organizer I want to be able to pull a list of email addresses for everyone scheduled to be at X staging location on Y date.

3) As a field organizer in the destination city, I want to be able see at a glance the distribution and raw numbers of the people assigned to my various staging locations by date. (e.g. 234 people at staging location X on date Y, which is 30% of total volunteers on this day.)

4) As a field organizer in the destination city, I want to be able to easily assign people to staging locations such that the total volunteers for a particular day are spread out by percentages. (e.g. On Saturday, I need 30% of my vols here, 20% there, etc. etc.)


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

## staging locations

add `table=staging` to the URL

returns JSON:

    {
        "staging": [
            {
                "city": "Reno",
                "people": [
                    "recd0lh1vxzcjUQGN",
                    "recPeOmqalv0iJaGc",
                ],
            "id": "recEi8nw4mFXyXbnN",
            "location": "Terminal"
            }
        ]
    }

