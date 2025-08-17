import pymysql
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

class ActionRetrieveClient(Action):

    def name(self) -> Text:
        return "action_retrieve_client"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Try to get client name from extracted entities
        client_name = next(tracker.get_latest_entity_values("client_name"), None)

        if not client_name:
            dispatcher.utter_message(text="Please provide the client's full name.")
            return []

        try:
            conn = pymysql.connect(
                host="localhost",       
                user="root",            
                password="",            
                database="react-crud" 
            )

            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                sql = "SELECT * FROM clients WHERE name LIKE %s"
                cursor.execute(sql, (f"%{client_name}%",))
                results = cursor.fetchall()

                if results:
                    response = ""
                    for row in results:
                        response += f"ID: {row['id']}, Name: {row['name']}, Email: {row['email']}\n"
                    dispatcher.utter_message(text=response.strip())
                else:
                    dispatcher.utter_message(text=f"No record found for {client_name}")

        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")

        return []
