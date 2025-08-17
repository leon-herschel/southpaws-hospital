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

def format_timedelta(td):
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    # Format to 12-hour clock
    suffix = "AM" if hours < 12 else "PM"
    hours_12 = hours % 12
    hours_12 = 12 if hours_12 == 0 else hours_12
    return f"{hours_12:02d}:{minutes:02d} {suffix}"

# --- CLIENTS ---
class ActionRetrieveClient(Action):
    def name(self): return "action_retrieve_client"
    def run(self, dispatcher, tracker, domain):
        client_name = next(tracker.get_latest_entity_values("client_name"), None)
        if not client_name:
            dispatcher.utter_message(text="Please provide the client's full name.")
            return []
        try:
            results = db_query("SELECT * FROM clients WHERE name LIKE %s", (f"%{client_name}%",))
            if results:
                for row in results:
                    response = (
                        f"Here are the details I found for {row['name']}:\n"
                        f"- ID: {row['id']}\n"
                        f"- Name: {row['name']}\n"
                        f"- Email: {row['email']}\n"
                        f"- Phone: {row['cellnumber']}\n"
                        f"- Address: {row['address']}"
                    )
                    dispatcher.utter_message(text=response)
            else:
                dispatcher.utter_message(text=f"No record found for {client_name}")
        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")
        return []

# --- APPOINTMENTS ---
class ActionRetrieveAppointment(Action):
    def name(self): return "action_retrieve_appointment"
    def run(self, dispatcher, tracker, domain):
        reference_number = next(tracker.get_latest_entity_values("reference_number"), None)
        client_name = next(tracker.get_latest_entity_values("name"), None)
        try:
            if reference_number:
                results = db_query("SELECT * FROM appointments WHERE reference_number=%s", (reference_number,))
            elif client_name:
                results = db_query(
                    "SELECT * FROM appointments WHERE LOWER(name) = LOWER(%s)",
                    (client_name,)
                )

                if not results:
                    results = db_query(
                        "SELECT * FROM appointments WHERE name REGEXP %s",
                        (f'\\b{client_name}\\b',)
                    )
                    
            else:
                dispatcher.utter_message(text="Provide a reference number or client name.")
                return []

            if results:
                for row in results:
                    doctor = db_query("SELECT first_name, last_name FROM internal_users WHERE id=%s", (row["doctor_id"],))
                    doctor_name = f"{doctor[0]['first_name']} {doctor[0]['last_name']}" if doctor else "N/A"
                    time_str = f"{format_timedelta(row['time'])} to {format_timedelta(row['end_time'])}"
                    response = (
                        "Here are the appointment details: \n"
                        f"- Ref #: {row['reference_number']}\n"
                        f"- Client: {row['name']} \n"
                        f"- Contact #: {row['contact']} \n"
                        f"- Pet: {row['pet_name']} ({row['pet_species']}, {row['pet_breed']})\n"
                        f"- Service(s): {row['service']}\n"
                        f"- Date: {row['date'].strftime('%B %d, %Y')}\n"
                        f"- Time: {time_str}\n"
                        f"- Doctor: {doctor_name}\n"
                        f"- Status: {row['status']}"
                    )
                    dispatcher.utter_message(text=response)
            else:
                dispatcher.utter_message(text="No appointment found.")
        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")
        return []

# --- PATIENTS ---
class ActionRetrievePatient(Action):
    def name(self): return "action_retrieve_patient"
    def run(self, dispatcher, tracker, domain):
        pet_name = next(tracker.get_latest_entity_values("pet_name"), None)
        if not pet_name:
            dispatcher.utter_message(text="Please provide the pet name.")
            return []
        try:
            results = db_query("SELECT * FROM patients WHERE name LIKE %s", (f"%{pet_name}%",))
            if results:
                for row in results:
                    owner = db_query("SELECT name FROM clients WHERE id=%s", (row['owner_id'],))
                    owner_name = owner[0]['name'] if owner else "N/A"
                    response = (
                        f"Here are the details for patient {row['name']}:\n"
                        f"- ID: {row['id']}\n"
                        f"- Name: {row['name']}\n"
                        f"- Species: {row['species']}\n"
                        f"- Breed: {row['breed']}\n"
                        f"- Birthdate: {row['birthdate']}\n"
                        f"- Age: {row['age']}\n"
                        f"- Owner: {owner_name}"
                    )
                    dispatcher.utter_message(text=response)
            else:
                dispatcher.utter_message(text=f"No patient found for {pet_name}")
        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")
        return []