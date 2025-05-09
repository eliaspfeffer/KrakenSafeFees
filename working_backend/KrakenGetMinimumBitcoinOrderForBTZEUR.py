import requests
import json

url = "https://api.kraken.com/0/public/AssetPairs?pair=XXBTZEUR"
headers = {'Accept': 'application/json'}

response = requests.get(url, headers=headers)
data = response.json()

# Extract the Euro Bitcoin pair and order minimum
eur_btc_pair = data['result']['XXBTZEUR']
ordermin = eur_btc_pair['ordermin']

print(ordermin)
