import pymysql
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from datetime import datetime, date, timedelta
import re
import dateutil.parser


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "react-crud"
}

STATUS_TO_PAGE = {
    "Pending": "/appointment/pending",
    "Confirmed": "/appointment/confirmed",
    "Done": "/appointment/done",
    "Cancelled": "/appointment/cancelled"
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

def build_split_word_query(field: str, value: str):
    """
    Builds a WHERE clause that requires all words in `value` to appear in `field`.
    Returns (condition_sql, params).
    """
    words = value.strip().split()
    conditions = " AND ".join([f"LOWER({field}) LIKE %s" for _ in words])
    params = [f"%{w.lower()}%" for w in words]
    return conditions, params

def parse_date_value(value, message_text: str = ""):
    txt = (message_text or "").lower()
    v = (value or "").strip().lower()

    if "today" in (v or txt):
        return date.today()
    if "tomorrow" in (v or txt):
        return date.today() + timedelta(days=1)

    if not v:
        return None

    try:
        parsed = dateutil.parser.parse(v, dayfirst=True, fuzzy=True)
        return parsed.date()
    except Exception:
        return None

class ActionListAppointments(Action):
    def name(self):
        return "action_list_appointments"

    async def run(self, dispatcher, tracker, domain):
        message_text = tracker.latest_message.get("text", "").lower()
        date_value = tracker.get_slot("date")

        dt = parse_date_value(date_value, message_text)

        if not dt:
            dispatcher.utter_message(text="Sorry, I couldn’t understand the date. Please try again with a clearer format (e.g., 'July 24, 2025').")
            return []

        date_iso = dt.strftime("%Y-%m-%d")
        human = dt.strftime("%B %d, %Y")

        url = f"/appointment/confirmed?date={date_iso}"

        dispatcher.utter_message(json_message={
            "appointments": [{
                "text": f"Here’s the link to confirmed appointments for {human}:",
                "link": {
                    "url": url,
                    "label": f"View appointments for {human}"
                }
            }]
        })

        return []

# --- CLIENTS ---
class ActionRetrieveClient(Action):
    def name(self): return "action_retrieve_client"

    def run(self, dispatcher, tracker, domain):
        client_name = next(tracker.get_latest_entity_values("client_name"), None)
        if not client_name:
            dispatcher.utter_message(text="Looking for client details? Please retype your request and include the client's full name.")
            return []
        try:
            conditions, params = build_split_word_query("name", client_name)
            query = f"SELECT * FROM clients WHERE {conditions}"
            results = db_query(query, params)

            if results:
                messages = []
                for row in results:
                    response = (
                        f"Here are the details I found for {row['name']}:\n"
                        f"**Name:** {row['name']}\n"
                        f"**Email:** {row['email']}\n"
                        f"**Phone:** {row['cellnumber']}\n"
                        f"**Address:** {row['address']}\n\n"
                        f"You can also find this client in the Clients Table:"
                    )
                    messages.append({
                        "text": response,
                        "link": {
                            "url": "/information/clients",
                            "searchName": row['name'],
                            "label": "View in Clients Table"
                        }
                    })

                dispatcher.utter_message(json_message={"clients": messages})
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
                results = db_query(
                    "SELECT * FROM appointments WHERE reference_number=%s AND status != 'Done'",
                    (reference_number,)
                )
            elif client_name:
                conditions, params = build_split_word_query("name", client_name)
                query = f"SELECT * FROM appointments WHERE {conditions} AND status != 'Done'"
                results = db_query(query, params)
            else:
                dispatcher.utter_message(text="Looking for appointment details? Please retype your request with the client's full name or reference number.")
                return []

            if results:
                messages = []
                for row in results:
                    doctor = db_query("SELECT first_name, last_name FROM internal_users WHERE id=%s", (row["doctor_id"],))
                    doctor_name = f"{doctor[0]['first_name']} {doctor[0]['last_name']}" if doctor else "N/A"
                    time_str = f"{format_timedelta(row['time'])} to {format_timedelta(row['end_time'])}"
                    response = (
                        f"Here are the appointment details for {row['name']}:\n"
                        f"**Ref #:** {row['reference_number']}\n"
                        f"**Client:** {row['name']}\n"
                        f"**Contact #:** {row['contact']}\n"
                        f"**Pet:** {row['pet_name']} ({row['pet_species']}, {row['pet_breed']})\n"
                        f"**Service(s):** {row['service']}\n"
                        f"**Date:** {row['date'].strftime('%B %d, %Y')}\n"
                        f"**Time:** {time_str}\n"
                        f"**Doctor:** {doctor_name}\n"
                        f"**Status:** {row['status']}\n\n"
                        f"You can also find this client in the Appointments Table:"
                    )

                    page_url = STATUS_TO_PAGE.get(row['status'], "/appointments")
                    messages.append({
                        "text": response,
                        "link": {
                            "url": page_url,
                            "searchName": row['name'],
                            "label": f"View in {row['status']} Appointments Table"
                        }
                    })

                dispatcher.utter_message(json_message={"appointments": messages})

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
            dispatcher.utter_message(text="Looking for a patient record? Please retype your request and include the pet's name.")
            return []

        try:
            conditions, params = build_split_word_query("name", pet_name)
            query = f"SELECT * FROM patients WHERE {conditions}"
            results = db_query(query, params)

            if results:
                messages = []
                for row in results:
                    owner = db_query("SELECT name FROM clients WHERE id=%s", (row['owner_id'],))
                    owner_name = owner[0]['name'] if owner else "N/A"
                    response = (
                        f"Here are the details for patient {row['name']}:\n"
                        f"**Name:** {row['name']}\n"
                        f"**Species:** {row['species']}\n"
                        f"**Breed:** {row['breed']}\n"
                        f"**Birthdate:** {row['birthdate']}\n"
                        f"**Age:** {row['age']}\n"
                        f"**Owner:** {owner_name}\n\n"
                        f"You can also find this information under the owner in the Clients Table:"
                    )
                    messages.append({
                        "text": response,
                        "link": {
                            "url": "/information/clients",
                            "searchName": owner_name,
                            "label": f"View ({owner_name}) in Clients Table"
                        }
                    })

                dispatcher.utter_message(json_message={"patients": messages})
            else:
                dispatcher.utter_message(text=f"No patient found for {pet_name}")
        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")
        return []