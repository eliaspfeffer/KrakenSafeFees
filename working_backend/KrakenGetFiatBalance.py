import base64
import hashlib
import hmac
import os
import sys
import time
import urllib.parse

import requests
from KrakenSignature import get_kraken_signature

# This is necessary to import the SecretTokens!
sys.path.append('./src/main/resources/python')
from SecretTokens import (kraken_api_host_url, kraken_cbe_api_key,
                          kraken_cbe_api_sec)


# Attaches auth headers and returns results of a POST request
def kraken_request(uri_path, data, api_key, api_sec):
    headers = {}
    headers['API-Key'] = api_key
    # get_kraken_signature() as defined in the 'Authentication' section
    headers['API-Sign'] = get_kraken_signature(uri_path, data, api_sec)             
    req = requests.post((kraken_api_host_url + uri_path), headers=headers, data=data)
    return req

# Construct the request and print the result
resp = kraken_request('/0/private/Balance', {
    "nonce": str(int(1000*time.time()))
}, kraken_cbe_api_key, kraken_cbe_api_sec)

print(resp.json())