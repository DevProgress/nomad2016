#!/usr/bin/python

from dateutil import parser as date_parser
import config
import requests

API_URL = 'https://api.airtable.com/v0/appU7X9oKojjv8LHV/%s'
AUTH = {'Authorization': 'Bearer %s' % config.AIRTABLE_TOKEN}

DAYS = {
    'recAEdu3P74gaEXK9': '2016-11-08',
    'recfIG2WSZGfXewUz': '2016-11-05',
    'rec1b5LeqgSyeurI4': '2016-11-02',
    'recZfnvjnMkTxf06w': '2016-11-07',
    'recyTWtUBEyXnPRoI': '2016-10-30',
    'recl72HN9QJL4Yppd': '2016-11-03',
    'recpdNGUaAG69F7f5': '2016-11-04',
    'recu0DOJ8RnTQQI7x': '2016-10-28',
    'recaTsCv4ZxztsQcm': '2016-11-06',
    'rec8CVx2DiC9LXGaN': '2016-10-26',
    'recMfUElHm7jQ7bCR': '2016-10-27',
    'recv2fntzt9nKppn0': '2016-11-01',
    'recePelbT1hsTYgCn': '2016-10-31',
    'recn7EpJAFQzLFDeE': '2016-10-29'
}

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
    people = {}
    print('records=%s' % len(data.get('records', [])))
    for p in data.get('records', []):
        #print(p)
        fields = p['fields']
        people[p['id']] = {
            'email': fields.get('Email', '')
        }
    return people


def load_people():
    url = API_URL % 'People'
    params = {
        'view': 'People Days'
    }
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    people = parse_people(data)
    while data.get('offset'):
        params['offset'] = data['offset']
        r = requests.get(url, headers=AUTH, params=params)
        print('offset=%s url=%s request=%s' % (params['offset'], url, r))
        data = r.json()
        people.update(parse_people(data))
    return people


def load_staging():
    url = API_URL % 'Staging Locations'
    params = {
        'view': 'Main View'
    }
    staging = {}
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    print('records=%s' % len(data.get('records', [])))
    for loc in data.get('records', []):
        fields = loc['fields']
        staging[loc['id']] = {
            'city': fields.get('City', ''),
            'location': fields['Staging Location'],
            'people': fields['All People']
        }
    return staging


def parse_carpools(data):
    '''
    Carpool Name
    People
    {
        "records": [
            {
                "id": "recy7Aw2wBxipLHnn",
                "fields": {
                    "Carpool Name": "\"Melanie Neault - CPID52\""
                    "People": ["rec8116cdd76088af", "rec245db9343f55e8"],
                    "Carpool Canvass Days": ["rec8116cdd76088af", "rec245db9343f55e8", "rec4f3bade67ff565"]
                }
            }
        ]
    }
    '''
    carpools = {}
    print('records=%s' % len(data.get('records', [])))
    for p in data.get('records', []):
        print(p)
        fields = p['fields']
        day_ids = fields.get('Carpool Canvass Days', [])
        carpools[p['id']] = {
            'name': fields.get('Carpool Name', ''),
            'people': fields.get('People', ''),
            'days': [DAYS[day_id] for day_id in day_ids]
        }
    return carpools


def load_carpools():
    url = API_URL % 'Carpools'
    params = {
        'view': 'Carpool People Dashboard'
    }
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    print('records=%s' % len(data.get('records', [])))
    carpools = parse_carpools(data)
    while data.get('offset'):
        params['offset'] = data['offset']
        r = requests.get(url, headers=AUTH, params=params)
        print('offset=%s url=%s request=%s' % (params['offset'], url, r))
        data = r.json()
        carpools.update(parse_carpools(data))
    return carpools


def load_canvass_days():
    url = API_URL % 'Canvass Days'
    params = {
        'view': 'Main View'
    }
    days = {}
    r = requests.get(url, headers=AUTH, params=params)
    print('url=%s request=%s' % (url, r))
    data = r.json()
    print('records=%s' % len(data.get('records', [])))
    return data.get('records', [])
    for day in data.get('records', []):
        days[day['id']] = day['fields']['Canvass Date']
        print('%s\t%s' % (day['id'], day['fields']['Canvass Date']))
    return days


def lambda_handler(event, context):
    print('event=%s' % event)
    rval = {}
    # "querystring": "date=20161028&table=people"
    qs = event.get('querystring', '')
    token_param = 'token=%s' % config.UI_TOKEN
    if token_param not in qs:
        return {}
    if 'table=people' in qs:
        rval['people'] = load_people()
    if 'table=staging' in qs:
        rval['staging'] = load_staging()
    if 'table=carpools' in qs:
        rval['carpools'] = load_carpools()
    return rval
