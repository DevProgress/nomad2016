#!/usr/bin/python

from dateutil import parser as date_parser
import requests

API_URL = 'https://api.airtable.com/v0/appU7X9oKojjv8LHV/%s'
AUTH = {'Authorization': 'Bearer keykla4QUXhDPlUTX'}

def parse_people(data):
    '''
    People
    Email
    Start Day "\"Saturday, October 22, 2016\""
    Return Day
    {
        "records": [
            {
                "id": "recy7Aw2wBxipLHnn",
                "fields": {
                }
            }
        ]
    }
    '''
    people = []
    print('records=%s' % len(data.get('records', [])))
    for p in data.get('records', []):
        #print(p)
        fields = p['fields']
        start_dt = date_parser.parse(fields['Start Day'][0].replace('\\"', ''))
        return_dt = date_parser.parse(fields['Return Day'][0].replace('\\"', ''))
        people.append({
            'id': p['id'],
            'email': fields.get('Email', ''),
            'start': start_dt.strftime('%Y-%m-%d'),
            'return': return_dt.strftime('%Y-%m-%d')
        })
    return people


def load_people():
    url = API_URL % 'People'
    params = {
        'view': 'People Days'
    }
    people = []
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    people = parse_people(data)
    while data.get('offset'):
        params['offset'] = data['offset']
        r = requests.get(url, headers=AUTH, params=params)
        print('offset=%s url=%s request=%s' % (params['offset'], url, r))
        data = r.json()
        people = people + parse_people(data)
    return people


def load_staging():
    url = API_URL % 'Staging Locations'
    params = {
        'view': 'Main View'
    }
    staging = []
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    print('records=%s' % len(data.get('records', [])))
    for loc in data.get('records', []):
        fields = loc['fields']
        staging.append({
            'id': loc['id'],
            'city': fields.get('City', ''),
            'location': fields['Staging Location'],
            'people': fields['All People']
        })
    return staging


def lambda_handler(event, context):
    print('event=%s' % event)
    rval = {}
    # "querystring": "date=20161028&table=people"
    qs = event.get('querystring', '')
    if 'table=people' in qs:
        rval['people'] = load_people()
    if 'table=staging' in qs:
        rval['staging'] = load_staging()
    return rval
