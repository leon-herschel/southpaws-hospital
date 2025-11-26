import pymysql
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
import difflib
import random
import re
import os
from dotenv import load_dotenv
import pymysql

# Load .env.domain from /api folder
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'api', '.env.domain')
load_dotenv(dotenv_path)

# Try loading
loaded = load_dotenv(dotenv_path)
print("Loaded:", loaded)

# Database config
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME")
}

def db_query(query, params=()):
    conn = pymysql.connect(**DB_CONFIG)
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute(query, params)
        return cursor.fetchall()

# --- FETCH SERVICES ---
class ActionListServices(Action):
    def name(self) -> Text:
        return "action_list_services"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            results = db_query("SELECT name FROM services")
            if results:
                # Start message
                services_text = "Here are the services we offer:\n"
                services_text += "\n".join([f"- {row['name']}" for row in results])

                dispatcher.utter_message(text=services_text)
            else:
                dispatcher.utter_message(text="Sorry, we don’t have any services listed at the moment.")
        except Exception as e:
            dispatcher.utter_message(text=f"Error fetching services: {str(e)}")

        return []
    
class ActionGetServicePrice(Action):
    def name(self):
        return "action_get_service_price"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        user_message = tracker.latest_message.get("text", "").strip()
        service_name = tracker.get_slot("service_name")
        last_service = tracker.get_slot("last_service")

        try:
            # Fetch service data
            api_url = os.getenv("API_URL")
            response = requests.get(f"{api_url}/get_services.php")
            data = response.json()
            if not data:
                dispatcher.utter_message(text="Sorry, I couldn’t retrieve service data right now.")
                return []

            normalized = [re.sub(r'[^a-z0-9 ]', '', s["name"].lower()) for s in data]
            user_input = re.sub(r'[^a-z0-9 ]+', '', (service_name or user_message).lower().strip())

            # Follow-up logic
            if any(kw in user_input for kw in ["how much is it", "what about that", "and that one", "how about that"]):
                if last_service:
                    matched_service = last_service
                else:
                    dispatcher.utter_message(text="Could you tell me which service you’re referring to?")
                    return []
            else:
                # Smart match logic
                best_match = None
                best_score = 0

                for i, name in enumerate(normalized):
                    score = difflib.SequenceMatcher(None, user_input, name).ratio()
                    if user_input in name:
                        score += 0.2  # boost for direct partial matches
                    if score > best_score:
                        best_score = score
                        best_match = data[i]["name"]

                matched_service = best_match if best_score >= 0.55 else None

            # Handle final response
            if matched_service:
                service = next((s for s in data if s["name"] == matched_service), None)
                if service:
                    name, price = service["name"], service["price"]
                    price_responses = [
                        f"The price for {name} is ₱{price:,}.",
                        f"It’ll cost around ₱{price:,} for {name}.",
                        f"The rate for {name} is ₱{price:,}.",
                        f"{name} costs ₱{price:,}.",
                    ]
                    dispatcher.utter_message(text=random.choice(price_responses))
                    return [
                        SlotSet("service_name", name),
                        SlotSet("last_service", name)
                    ]
                else:
                    dispatcher.utter_message(text="Sorry, I couldn’t find details for that service.")
            else:
                dispatcher.utter_message(
                    text=f"Sorry, I couldn’t find a service matching '{service_name}'. Can you rephrase it?"
                )

        except Exception as e:
            dispatcher.utter_message(text=f"Something went wrong: {str(e)}")

        return []
