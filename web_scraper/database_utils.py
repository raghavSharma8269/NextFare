import psycopg2
import arrow
from dotenv import load_dotenv
import os

load_dotenv()

def setup_database_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn

def save_eventbrite_event(event_data, ticket_data):
    conn = setup_database_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        insert_data = {
            'event_title': event_data.get('title'),
            'event_start_date': event_data.get('start_date'),
            'event_date_time': event_data.get('date_time'),
            'event_summary': event_data.get('summary'),
            'event_address': event_data.get('address'),
            'event_image_url': event_data.get('image'),
            'directions_url': event_data.get('directions_url'),
            'event_page_url': event_data.get('page_url'),
            'latitude': float(event_data.get('latitude')) if event_data.get('latitude') else None,
            'longitude': float(event_data.get('longitude')) if event_data.get('longitude') else None,
            'total_capacity': ticket_data.get('total_capacity') if ticket_data else None,
            'tickets_sold': ticket_data.get('tickets_sold') if ticket_data else None,
            'tickets_remaining': ticket_data.get('tickets_remaining') if ticket_data else None,
            'event_source': 'EVENTBRITE'
        }
        
        insert_query = """
        INSERT INTO events (
            event_title, event_start_date, event_date_time, event_summary,
            event_address, event_image_url, directions_url, event_page_url,
            latitude, longitude, total_capacity, tickets_sold, tickets_remaining,
            time_added, time_updated, event_source
        ) VALUES (
            %(event_title)s, %(event_start_date)s, %(event_date_time)s, %(event_summary)s,
            %(event_address)s, %(event_image_url)s, %(directions_url)s, %(event_page_url)s,
            %(latitude)s, %(longitude)s, %(total_capacity)s, %(tickets_sold)s, %(tickets_remaining)s,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, %(event_source)s
        )
        ON CONFLICT (event_page_url)
        DO UPDATE SET
            event_title = EXCLUDED.event_title,
            event_start_date = EXCLUDED.event_start_date,
            event_date_time = EXCLUDED.event_date_time,
            event_summary = EXCLUDED.event_summary,
            event_address = EXCLUDED.event_address,
            event_image_url = EXCLUDED.event_image_url,
            directions_url = EXCLUDED.directions_url,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            total_capacity = EXCLUDED.total_capacity,
            tickets_sold = EXCLUDED.tickets_sold,
            tickets_remaining = EXCLUDED.tickets_remaining,
            time_updated = CURRENT_TIMESTAMP
        """
        
        cursor.execute(insert_query, insert_data)
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Database error for {insert_data.get('event_title', 'Unknown')}: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def save_meetup_event(meetup_data):
    conn = setup_database_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        # Parse timestamps first
        raw_start_date = None
        raw_end_date = None
        date_time_formatted = None
        
        if meetup_data.get('start_datetime'):
            try:
                raw_start_date = arrow.get(meetup_data['start_datetime']).datetime
            except:
                pass
                
        if meetup_data.get('end_datetime'):
            try:
                raw_end_date = arrow.get(meetup_data['end_datetime']).datetime
            except:
                pass
        
        # Format readable date_time string
        if meetup_data.get('start_datetime') and meetup_data.get('end_datetime'):
            try:
                start_dt = arrow.get(meetup_data['start_datetime'])
                end_dt = arrow.get(meetup_data['end_datetime'])
                start_readable = start_dt.format('dddd, MMMM D, YYYY [at] h:mm A')
                end_readable = end_dt.format('h:mm A')
                date_time_formatted = f"{start_readable} - {end_readable}"
            except:
                pass
        elif meetup_data.get('start_datetime'):
            try:
                start_dt = arrow.get(meetup_data['start_datetime'])
                date_time_formatted = start_dt.format('dddd, MMMM D, YYYY [at] h:mm A')
            except:
                pass
        
        insert_data = {
    'event_title': meetup_data.get('title'),
    'event_date_time': date_time_formatted,
    'event_summary': meetup_data.get('description'),
    'event_address': meetup_data.get('full_address') or meetup_data.get('venue_address'),
    'event_image_url': meetup_data.get('image_url'),
    'event_page_url': meetup_data.get('event_url'),
    'latitude': float(meetup_data.get('latitude')) if meetup_data.get('latitude') else None,
    'longitude': float(meetup_data.get('longitude')) if meetup_data.get('longitude') else None,
    'tickets_sold': meetup_data.get('going_count'),
    'event_start_time': raw_start_date,
    'event_end_time': raw_end_date,
    'event_source': 'MEETUP'
}
        
        insert_query = """
INSERT INTO events (
    event_title, event_date_time, event_summary,
    event_address, event_image_url, event_page_url,
    latitude, longitude, tickets_sold,
    event_start_time, event_end_time, event_source
) VALUES (
    %(event_title)s, %(event_date_time)s, %(event_summary)s,
    %(event_address)s, %(event_image_url)s, %(event_page_url)s,
    %(latitude)s, %(longitude)s, %(tickets_sold)s,
    %(event_start_time)s, %(event_end_time)s, %(event_source)s
)
ON CONFLICT (event_page_url)
DO UPDATE SET
    event_title = EXCLUDED.event_title,
    event_date_time = EXCLUDED.event_date_time,
    event_summary = EXCLUDED.event_summary,
    event_address = EXCLUDED.event_address,
    event_image_url = EXCLUDED.event_image_url,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    tickets_sold = EXCLUDED.tickets_sold,
    event_start_time = EXCLUDED.event_start_time,
    event_end_time = EXCLUDED.event_end_time,
    event_source = EXCLUDED.event_source,
    time_updated = CURRENT_TIMESTAMP
"""
        
        cursor.execute(insert_query, insert_data)
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Database error for {meetup_data.get('title', 'Unknown')}: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()