from flask import Flask, jsonify, request
from flask_cors import CORS
from apify_client import ApifyClient

app = Flask(__name__)
CORS(app)

@app.route('/api/fetch-events', methods=['POST'])
def fetch_events():
    try:
        # Initialize ApifyClient with your token
        client = ApifyClient("apify_api_umsTWGEgpUESQ1LVBKeeL9o7vMhFZ336Sa3z
 ")

        # Prepare the Actor input (use searchQueries if provided in request, or startUrls as fallback)
        run_input = request.json.get("run_input", {
            "startUrls": ["https://www.facebook.com/events/search?q=brampton&filters=eyJycF9ldmVudHNfbG9jYXRpb246MCI6IntcIm5hbWVcIjpcImZpbHRlcl9ldmVudHNfbG9jYXRpb25cIixcImFyZ3NcIjpcIjExMDE4NTA4NTY2ODcwMlwifSIsImZpbHRlcl9ldmVudHNfZGF0ZV9yYW5nZTowIjoie1wibmFtZVwiOlwiZmlsdGVyX2V2ZW50c19kYXRlXCIsXCJhcmdzXCI6XCIyMDI0LTExLTA0fjIwMjQtMTEtMTBcIn0ifQ%3D%3D"],
            "maxEvents": 10,
        })

        # Execute the Apify Actor and wait for it to complete
        run = client.actor("UZBnerCFBo5FgGouO").call(run_input=run_input)

        # Fetch results from Apify’s dataset
        events = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            # Extract event and location details
            event_data = {
                "name": item.get("name", "N/A"),
                "location_name": item.get("location", {}).get("name", "N/A"),
                "latitude": item.get("location", {}).get("latitude", "N/A"),
                "longitude": item.get("location", {}).get("longitude", "N/A"),
            }
            events.append(event_data)

        # Optionally write to a file (comment out if not needed)
        with open('output2.txt', 'w') as file:
            file.write("Results from dataset:\n")
            for event in events:
                file.write(f"Event: {event['name']}\n")
                file.write(f"Location Name: {event['location_name']}\n")
                file.write(f"Latitude: {event['latitude']}\n")
                file.write(f"Longitude: {event['longitude']}\n\n")

        # Return the results as JSON response
        return jsonify(events), 200

    except Exception as e:
        # Handle any errors that occur and provide a meaningful error message
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)