import pymysql
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "react-crud"
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
